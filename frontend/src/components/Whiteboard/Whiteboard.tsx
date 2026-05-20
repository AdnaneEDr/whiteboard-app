import { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import type Konva from 'konva';
import {
    getImages, uploadImage, updateImage, deleteImage,
    getTexts, createText, updateText, deleteText,
    getDrawings, createDrawing, updateDrawing, deleteDrawing,
    getShapes, createShape, updateShape, deleteShape,
} from '../../services/api';
import type { IImageNode, ITextNode, IDrawingNode, IShapeNode } from '../../types';
import ImageNodeComponent from './ImageNode';
import TextNodeComponent from './TextNode';
import DrawingNodeComponent from './DrawingNode';
import ShapeNodeComponent from './ShapeNode';
import Minimap from './Minimap';
import PropertiesBar from './PropertiesBar';
import { useTheme } from '../../hooks/useTheme';

interface Props {
    whiteboardId: number;
    whiteboardName: string;
    onLogout: () => void;
    onBackToDashboard: () => void;
}

type Tool = 'select' | 'draw' | 'rect' | 'circle' | 'arrow';
type SelectedItem =
    | { type: 'image';   id: number }
    | { type: 'text';    id: number }
    | { type: 'drawing'; id: number }
    | { type: 'shape';   id: number }
    | null;

interface HistoryEntry {
    images:   IImageNode[];
    texts:    ITextNode[];
    drawings: IDrawingNode[];
    shapes:   IShapeNode[];
}

const MIN_SCALE   = 0.1;
const MAX_SCALE   = 5;
const ZOOM_FACTOR = 1.04;
const SIDEBAR_W   = 64;

const defaultImage = (p: Partial<IImageNode>): IImageNode => ({
    id: 0, userId: 0, whiteboardId: 0, url: '', x: 0, y: 0, width: 200, height: 200,
    rotation: 0, zIndex: 0, opacity: 1, brightness: 1, contrast: 1,
    saturation: 1, blur: 0, grayscale: 0, sepia: 0, locked: false, createdAt: '', ...p,
});

const defaultText = (p: Partial<ITextNode>): ITextNode => ({
    id: 0, userId: 0, whiteboardId: 0, text: '', x: 0, y: 0, fontSize: 20,
    color: '#f0f0f0', fontFamily: 'sans-serif', fontStyle: 'normal',
    align: 'left', rotation: 0, zIndex: 0, locked: false, createdAt: '', ...p,
});

const defaultDrawing = (p: Partial<IDrawingNode>): IDrawingNode => ({
    id: 0, userId: 0, whiteboardId: 0, points: [], color: '#ffffff',
    strokeWidth: 4, opacity: 1, zIndex: 0, tension: 0.5, locked: false, createdAt: '', ...p,
});

const defaultShape = (p: Partial<IShapeNode>): IShapeNode => ({
    id: 0, userId: 0, whiteboardId: 0, type: 'rect', x: 0, y: 0, width: 150, height: 100,
    rotation: 0, fill: 'transparent', stroke: '#ffffff', strokeWidth: 2,
    opacity: 1, zIndex: 0, locked: false, createdAt: '', ...p,
});

const Whiteboard = ({ whiteboardId, whiteboardName, onLogout, onBackToDashboard }: Props) => {
    const { toggleTheme, colors, isDark } = useTheme();
    const c = colors;

    const [images,   setImages]   = useState<IImageNode[]>([]);
    const [texts,    setTexts]    = useState<ITextNode[]>([]);
    const [drawings, setDrawings] = useState<IDrawingNode[]>([]);
    const [shapes,   setShapes]   = useState<IShapeNode[]>([]);

    const [selected,   setSelected]   = useState<SelectedItem>(null);
    const [activeTool, setActiveTool] = useState<Tool>('select');

    // Draw tool state
    const [drawColor,       setDrawColor]       = useState('#ffffff');
    const [drawStrokeWidth, setDrawStrokeWidth] = useState(4);
    const [currentDrawing,  setCurrentDrawing]  = useState<number[] | null>(null);
    const isDrawing = useRef(false);

    // Shape tool state
    const [shapeStroke,  setShapeStroke]  = useState('#ffffff');
    const [shapeFill,    setShapeFill]    = useState('transparent');
    const [shapeStrokeW, setShapeStrokeW] = useState(2);

    // Silence TS "unused setter" — these are used by the draw-options mini-panel below
    void setDrawStrokeWidth; void setShapeStroke; void setShapeFill; void setShapeStrokeW;
    const shapeStart = useRef<{ x: number; y: number } | null>(null);
    const [previewShape, setPreviewShape] = useState<IShapeNode | null>(null);

    const [scale,      setScale]      = useState(1);
    const [stagePos,   setStagePos]   = useState({ x: 0, y: 0 });
    const [uploading,  setUploading]  = useState(false);
    const [dimensions, setDimensions] = useState({ w: window.innerWidth, h: window.innerHeight });
    const [showHelp,   setShowHelp]   = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const history      = useRef<HistoryEntry[]>([]);
    const historyIndex = useRef<number>(-1);
    const stageRef     = useRef<Konva.Stage>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const saveTimers   = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    const imagesRef   = useRef<IImageNode[]>([]);
    const textsRef    = useRef<ITextNode[]>([]);
    const drawingsRef = useRef<IDrawingNode[]>([]);
    const shapesRef   = useRef<IShapeNode[]>([]);
    useEffect(() => { imagesRef.current   = images;   }, [images]);
    useEffect(() => { textsRef.current    = texts;    }, [texts]);
    useEffect(() => { drawingsRef.current = drawings; }, [drawings]);
    useEffect(() => { shapesRef.current   = shapes;   }, [shapes]);

    // ─── History ───────────────────────────────────────────────────────
    const pushHistory = useCallback((
        imgs: IImageNode[], txts: ITextNode[],
        drws: IDrawingNode[], shps: IShapeNode[],
    ) => {
        history.current = history.current.slice(0, historyIndex.current + 1);
        history.current.push({
            images:   imgs.map((i) => ({ ...i })),
            texts:    txts.map((t) => ({ ...t })),
            drawings: drws.map((d) => ({ ...d, points: [...d.points] })),
            shapes:   shps.map((s) => ({ ...s })),
        });
        historyIndex.current = history.current.length - 1;
    }, []);

    const undo = useCallback(() => {
        if (historyIndex.current <= 0) return;
        historyIndex.current -= 1;
        const e = history.current[historyIndex.current];
        setImages(e.images.map((i) => ({ ...i })));
        setTexts(e.texts.map((t) => ({ ...t })));
        setDrawings(e.drawings.map((d) => ({ ...d, points: [...d.points] })));
        setShapes(e.shapes.map((s) => ({ ...s })));
        setSelected(null);
    }, []);

    const redo = useCallback(() => {
        if (historyIndex.current >= history.current.length - 1) return;
        historyIndex.current += 1;
        const e = history.current[historyIndex.current];
        setImages(e.images.map((i) => ({ ...i })));
        setTexts(e.texts.map((t) => ({ ...t })));
        setDrawings(e.drawings.map((d) => ({ ...d, points: [...d.points] })));
        setShapes(e.shapes.map((s) => ({ ...s })));
        setSelected(null);
    }, []);

    // ─── Load data ────────────────────────────────────────────────────
    useEffect(() => {
        setImages([]); setTexts([]); setDrawings([]); setShapes([]);
        setSelected(null);
        history.current = []; historyIndex.current = -1;

        Promise.all([
            getImages(whiteboardId), getTexts(whiteboardId),
            getDrawings(whiteboardId), getShapes(whiteboardId),
        ]).then(([imgRes, txtRes, drwRes, shpRes]) => {
            const imgs = imgRes.data.map((i: IImageNode) => defaultImage(i));
            const txts = txtRes.data.map((t: ITextNode)  => defaultText(t));
            const drws = drwRes.data.map((d: IDrawingNode) => defaultDrawing(d));
            const shps = shpRes.data.map((s: IShapeNode)  => defaultShape(s));
            setImages(imgs); setTexts(txts); setDrawings(drws); setShapes(shps);
            pushHistory(imgs, txts, drws, shps);

            const allX = [...imgs.map((i: IImageNode) => i.x), ...txts.map((t: ITextNode) => t.x), ...shps.map((s: IShapeNode) => s.x)];
            const allY = [...imgs.map((i: IImageNode) => i.y), ...txts.map((t: ITextNode) => t.y), ...shps.map((s: IShapeNode) => s.y)];
            if (allX.length > 0) {
                const cx = (Math.min(...allX) + Math.max(...allX)) / 2;
                const cy = (Math.min(...allY) + Math.max(...allY)) / 2;
                setStagePos({ x: (window.innerWidth - SIDEBAR_W) / 2 - cx, y: window.innerHeight / 2 - cy });
            }
        });
    }, [whiteboardId, pushHistory]);

    // ─── Resize ───────────────────────────────────────────────────────
    useEffect(() => {
        const onResize = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // ─── Keyboard ─────────────────────────────────────────────────────
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); return; }
            if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); redo(); return; }
            if ((e.key === 'Delete' || e.key === 'Backspace') && selected) { e.preventDefault(); handleDelete(); return; }
            if (e.key === 'd' && (e.ctrlKey || e.metaKey) && selected) { e.preventDefault(); handleDuplicate(); return; }
            if (e.key === 'l' && selected) { e.preventDefault(); handleToggleLock(); return; }
            if (e.key === 'v') { setActiveTool('select'); return; }
            if (e.key === 'p') { setActiveTool('draw');   return; }
            if (e.key === 'r') { setActiveTool('rect');   return; }
            if (e.key === 'o') { setActiveTool('circle'); return; }
            if (e.key === 'a') { setActiveTool('arrow');  return; }
            if (e.key === '?') setShowHelp((v) => !v);
            if (e.key === 'Escape') { setSelected(null); setActiveTool('select'); }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, undo, redo]);

    // ─── Zoom ─────────────────────────────────────────────────────────
    const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = stageRef.current!;
        const oldScale = stage.scaleX();
        const pointer  = stage.getPointerPosition()!;
        const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
        const dir      = e.evt.deltaY < 0 ? 1 : -1;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, oldScale * (dir > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR)));
        const newPos   = { x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale };
        setScale(newScale); setStagePos(newPos);
    }, []);

    // ─── Stage mouse handlers (drawing + shapes) ───────────────────
    const handleStageMouseDown = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
        // Only fire on blank canvas
        if (_e.target !== _e.target.getStage() && activeTool === 'select') return;

        if (activeTool === 'select') {
            setSelected(null);
            return;
        }

        const stage = stageRef.current!;
        const pos   = stage.getPointerPosition()!;
        const wx    = (pos.x - stagePos.x) / scale;
        const wy    = (pos.y - stagePos.y) / scale;

        if (activeTool === 'draw') {
            isDrawing.current = true;
            setCurrentDrawing([wx, wy]);
            return;
        }

        // Shape tools
        if (activeTool === 'rect' || activeTool === 'circle' || activeTool === 'arrow') {
            shapeStart.current = { x: wx, y: wy };
            setPreviewShape(defaultShape({ type: activeTool, x: wx, y: wy, width: 0, height: 0, stroke: shapeStroke, fill: shapeFill, strokeWidth: shapeStrokeW }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTool, stagePos, scale, shapeStroke, shapeFill, shapeStrokeW]);

    const handleStageMouseMove = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
        if (activeTool === 'draw' && isDrawing.current) {
            const stage = stageRef.current!;
            const pos   = stage.getPointerPosition()!;
            const wx    = (pos.x - stagePos.x) / scale;
            const wy    = (pos.y - stagePos.y) / scale;
            setCurrentDrawing((prev) => prev ? [...prev, wx, wy] : [wx, wy]);
            return;
        }

        if ((activeTool === 'rect' || activeTool === 'circle' || activeTool === 'arrow') && shapeStart.current) {
            const stage = stageRef.current!;
            const pos   = stage.getPointerPosition()!;
            const wx    = (pos.x - stagePos.x) / scale;
            const wy    = (pos.y - stagePos.y) / scale;
            const sx    = shapeStart.current.x;
            const sy    = shapeStart.current.y;
            setPreviewShape(defaultShape({
                type:   activeTool,
                x:      Math.min(sx, wx),
                y:      Math.min(sy, wy),
                width:  Math.abs(wx - sx),
                height: Math.abs(wy - sy),
                stroke: shapeStroke,
                fill:   shapeFill,
                strokeWidth: shapeStrokeW,
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTool, stagePos, scale, shapeStroke, shapeFill, shapeStrokeW]);

    const handleStageMouseUp = useCallback(async () => {
        // Finish drawing
        if (activeTool === 'draw' && isDrawing.current && currentDrawing && currentDrawing.length >= 4) {
            isDrawing.current = false;
            const res = await createDrawing({
                points: currentDrawing, color: drawColor,
                strokeWidth: drawStrokeWidth, opacity: 1, tension: 0.5,
            }, whiteboardId);
            const newDrawing = defaultDrawing(res.data);
            setDrawings((prev) => {
                const next = [...prev, newDrawing];
                pushHistory(imagesRef.current, textsRef.current, next, shapesRef.current);
                return next;
            });
            setCurrentDrawing(null);
            return;
        }
        isDrawing.current = false;
        setCurrentDrawing(null);

        // Finish shape
        if ((activeTool === 'rect' || activeTool === 'circle' || activeTool === 'arrow') && previewShape && previewShape.width > 5 && previewShape.height > 5) {
            const res = await createShape({
                type:        activeTool,
                x:           previewShape.x,
                y:           previewShape.y,
                width:       previewShape.width,
                height:      previewShape.height,
                stroke:      shapeStroke,
                fill:        shapeFill,
                strokeWidth: shapeStrokeW,
            }, whiteboardId);
            const newShape = defaultShape(res.data);
            setShapes((prev) => {
                const next = [...prev, newShape];
                pushHistory(imagesRef.current, textsRef.current, drawingsRef.current, next);
                return next;
            });
            setSelected({ type: 'shape', id: newShape.id });
            setActiveTool('select');
        }
        shapeStart.current = null;
        setPreviewShape(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTool, currentDrawing, previewShape, drawColor, drawStrokeWidth, whiteboardId, shapeStroke, shapeFill, shapeStrokeW, pushHistory]);

    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (activeTool !== 'select') return;
        if (e.target === e.target.getStage()) setSelected(null);
    };

    // ─── Add text ─────────────────────────────────────────────────────
    const addTextAt = useCallback(async (wx: number, wy: number) => {
        const res = await createText({ text: 'Double-cliquez pour éditer', x: wx, y: wy, fontSize: 20, color: isDark ? '#f0f0f0' : '#111111' }, whiteboardId);
        const newText = defaultText(res.data);
        setTexts((prev) => { const next = [...prev, newText]; pushHistory(imagesRef.current, next, drawingsRef.current, shapesRef.current); return next; });
        setSelected({ type: 'text', id: newText.id });
    }, [pushHistory, whiteboardId, isDark]);

    const addTextAtCenter = useCallback(() => {
        const wx = (-stagePos.x + (dimensions.w - SIDEBAR_W) / 2) / scale;
        const wy = (-stagePos.y + dimensions.h / 2) / scale;
        void addTextAt(wx, wy);
    }, [stagePos, scale, dimensions, addTextAt]);

    const handleStageDblClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (activeTool !== 'select') return;
        if (e.target !== e.target.getStage()) return;
        const stage = stageRef.current!;
        const pos   = stage.getPointerPosition()!;
        void addTextAt((pos.x - stagePos.x) / scale, (pos.y - stagePos.y) / scale);
    }, [stagePos, scale, addTextAt, activeTool]);

    // ─── Upload ───────────────────────────────────────────────────────
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await uploadImage(file, whiteboardId);
            const newImg = defaultImage(res.data);
            const positioned: IImageNode = {
                ...newImg,
                x: (-stagePos.x + (dimensions.w - SIDEBAR_W) / 2) / scale - newImg.width / 2,
                y: (-stagePos.y + dimensions.h / 2) / scale - newImg.height / 2,
            };
            setImages((prev) => { const next = [...prev, positioned]; pushHistory(next, textsRef.current, drawingsRef.current, shapesRef.current); return next; });
            setSelected({ type: 'image', id: newImg.id });
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 2500);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // ─── Change handlers ──────────────────────────────────────────────
    const handleImageChange = useCallback((id: number, updated: Partial<IImageNode>) => {
        setImages((prev) => {
            const next = prev.map((img) => img.id === id ? { ...img, ...updated } : img);
            clearTimeout(saveTimers.current[`img-${id}`]);
            saveTimers.current[`img-${id}`] = setTimeout(() => {
                const img = imagesRef.current.find((i) => i.id === id);
                if (img) updateImage(id, img);
                pushHistory(imagesRef.current, textsRef.current, drawingsRef.current, shapesRef.current);
            }, 500);
            return next;
        });
    }, [pushHistory]);

    const handleTextChange = useCallback((id: number, updated: Partial<ITextNode>) => {
        setTexts((prev) => {
            const next = prev.map((t) => t.id === id ? { ...t, ...updated } : t);
            clearTimeout(saveTimers.current[`txt-${id}`]);
            saveTimers.current[`txt-${id}`] = setTimeout(() => {
                const t = textsRef.current.find((i) => i.id === id);
                if (t) updateText(id, t);
                pushHistory(imagesRef.current, textsRef.current, drawingsRef.current, shapesRef.current);
            }, 500);
            return next;
        });
    }, [pushHistory]);

    const handleDrawingChange = useCallback((id: number, updated: Partial<IDrawingNode>) => {
        setDrawings((prev) => {
            const next = prev.map((d) => d.id === id ? { ...d, ...updated } : d);
            clearTimeout(saveTimers.current[`drw-${id}`]);
            saveTimers.current[`drw-${id}`] = setTimeout(() => {
                const d = drawingsRef.current.find((i) => i.id === id);
                if (d) updateDrawing(id, d);
                pushHistory(imagesRef.current, textsRef.current, drawingsRef.current, shapesRef.current);
            }, 500);
            return next;
        });
    }, [pushHistory]);

    const handleShapeChange = useCallback((id: number, updated: Partial<IShapeNode>) => {
        setShapes((prev) => {
            const next = prev.map((s) => s.id === id ? { ...s, ...updated } : s);
            clearTimeout(saveTimers.current[`shp-${id}`]);
            saveTimers.current[`shp-${id}`] = setTimeout(() => {
                const s = shapesRef.current.find((i) => i.id === id);
                if (s) updateShape(id, s);
                pushHistory(imagesRef.current, textsRef.current, drawingsRef.current, shapesRef.current);
            }, 500);
            return next;
        });
    }, [pushHistory]);

    // ─── Delete ───────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!selected) return;
        if (selected.type === 'image') {
            await deleteImage(selected.id);
            setImages((prev) => { const next = prev.filter((i) => i.id !== selected.id); pushHistory(next, textsRef.current, drawingsRef.current, shapesRef.current); return next; });
        } else if (selected.type === 'text') {
            await deleteText(selected.id);
            setTexts((prev) => { const next = prev.filter((t) => t.id !== selected.id); pushHistory(imagesRef.current, next, drawingsRef.current, shapesRef.current); return next; });
        } else if (selected.type === 'drawing') {
            await deleteDrawing(selected.id);
            setDrawings((prev) => { const next = prev.filter((d) => d.id !== selected.id); pushHistory(imagesRef.current, textsRef.current, next, shapesRef.current); return next; });
        } else if (selected.type === 'shape') {
            await deleteShape(selected.id);
            setShapes((prev) => { const next = prev.filter((s) => s.id !== selected.id); pushHistory(imagesRef.current, textsRef.current, drawingsRef.current, next); return next; });
        }
        setSelected(null);
    };

    // ─── Duplicate ────────────────────────────────────────────────────
    const handleDuplicate = async () => {
        if (!selected) return;
        if (selected.type === 'image') {
            const orig = images.find((i) => i.id === selected.id);
            if (!orig) return;
            const dup: IImageNode = { ...orig, id: Date.now(), x: orig.x + 20, y: orig.y + 20, createdAt: '' };
            setImages((prev) => { const next = [...prev, dup]; pushHistory(next, textsRef.current, drawingsRef.current, shapesRef.current); return next; });
            setSelected({ type: 'image', id: dup.id });
        } else if (selected.type === 'text') {
            const orig = texts.find((t) => t.id === selected.id);
            if (!orig) return;
            const res = await createText({ ...orig, x: orig.x + 20, y: orig.y + 20 }, whiteboardId);
            const dup = defaultText(res.data);
            setTexts((prev) => { const next = [...prev, dup]; pushHistory(imagesRef.current, next, drawingsRef.current, shapesRef.current); return next; });
            setSelected({ type: 'text', id: dup.id });
        } else if (selected.type === 'shape') {
            const orig = shapes.find((s) => s.id === selected.id);
            if (!orig) return;
            const res = await createShape({ ...orig, x: orig.x + 20, y: orig.y + 20 }, whiteboardId);
            const dup = defaultShape(res.data);
            setShapes((prev) => { const next = [...prev, dup]; pushHistory(imagesRef.current, textsRef.current, drawingsRef.current, next); return next; });
            setSelected({ type: 'shape', id: dup.id });
        }
    };

    // ─── Lock ─────────────────────────────────────────────────────────
    const handleToggleLock = () => {
        if (!selected) return;
        if (selected.type === 'image') {
            const n = images.find((i) => i.id === selected.id);
            if (n) handleImageChange(selected.id, { locked: !n.locked });
        } else if (selected.type === 'text') {
            const n = texts.find((t) => t.id === selected.id);
            if (n) handleTextChange(selected.id, { locked: !n.locked });
        } else if (selected.type === 'drawing') {
            const n = drawings.find((d) => d.id === selected.id);
            if (n) handleDrawingChange(selected.id, { locked: !n.locked });
        } else if (selected.type === 'shape') {
            const n = shapes.find((s) => s.id === selected.id);
            if (n) handleShapeChange(selected.id, { locked: !n.locked });
        }
    };

    // ─── Z-index ──────────────────────────────────────────────────────
    const moveZ = (dir: 1 | -1) => {
        if (!selected) return;
        if (selected.type === 'image') {
            const n = images.find((i) => i.id === selected.id);
            if (n) handleImageChange(selected.id, { zIndex: n.zIndex + dir });
        } else if (selected.type === 'text') {
            const n = texts.find((t) => t.id === selected.id);
            if (n) handleTextChange(selected.id, { zIndex: n.zIndex + dir });
        } else if (selected.type === 'drawing') {
            const n = drawings.find((d) => d.id === selected.id);
            if (n) handleDrawingChange(selected.id, { zIndex: n.zIndex + dir });
        } else if (selected.type === 'shape') {
            const n = shapes.find((s) => s.id === selected.id);
            if (n) handleShapeChange(selected.id, { zIndex: n.zIndex + dir });
        }
    };

    // ─── Reset view ───────────────────────────────────────────────────
    const handleResetView = () => {
        setScale(1);
        const allX = [...imagesRef.current.map((i) => i.x), ...textsRef.current.map((t) => t.x), ...shapesRef.current.map((s) => s.x)];
        const allY = [...imagesRef.current.map((i) => i.y), ...textsRef.current.map((t) => t.y), ...shapesRef.current.map((s) => s.y)];
        if (allX.length === 0) { setStagePos({ x: 0, y: 0 }); return; }
        const cx = (Math.min(...allX) + Math.max(...allX)) / 2;
        const cy = (Math.min(...allY) + Math.max(...allY)) / 2;
        setStagePos({ x: (dimensions.w - SIDEBAR_W) / 2 - cx, y: dimensions.h / 2 - cy });
    };

    // ─── Export ───────────────────────────────────────────────────────
    const handleExport = (format: 'png' | 'jpeg') => {
        const stage = stageRef.current;
        if (!stage) return;
        const dataURL = stage.toDataURL({ pixelRatio: 2, mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png', quality: 0.95 });
        const link = document.createElement('a');
        link.href = dataURL; link.download = `${whiteboardName}-export.${format}`; link.click();
    };

    // ─── Render ───────────────────────────────────────────────────────
    const allNodes = [
        ...images.map((d)   => ({ type: 'image'   as const, data: d,   zIndex: d.zIndex ?? 0 })),
        ...texts.map((d)    => ({ type: 'text'    as const, data: d,   zIndex: d.zIndex ?? 0 })),
        ...drawings.map((d) => ({ type: 'drawing' as const, data: d,   zIndex: d.zIndex ?? 0 })),
        ...shapes.map((d)   => ({ type: 'shape'   as const, data: d,   zIndex: d.zIndex ?? 0 })),
    ].sort((a, b) => a.zIndex - b.zIndex);

    const selectedImage   = selected?.type === 'image'   ? images.find((i) => i.id === selected.id)   : null;
    const selectedText    = selected?.type === 'text'    ? texts.find((t) => t.id === selected.id)     : null;
    const selectedDrawing = selected?.type === 'drawing' ? drawings.find((d) => d.id === selected.id) : null;
    const selectedShape   = selected?.type === 'shape'   ? shapes.find((s) => s.id === selected.id)   : null;
    const selectedLocked  = selectedImage?.locked || selectedText?.locked || selectedDrawing?.locked || selectedShape?.locked;
    const canUndo = historyIndex.current > 0;
    const canRedo = historyIndex.current < history.current.length - 1;

    const stageDraggable = activeTool === 'select';
    const stageCursor = activeTool === 'draw' ? 'crosshair' : activeTool !== 'select' ? 'crosshair' : 'default';

    // ─── Sidebar helpers ──────────────────────────────────────────────
    const SideBtn = ({ onClick, title, disabled = false, active = false, danger = false, children }: {
        onClick: () => void; title: string; disabled?: boolean; active?: boolean; danger?: boolean; children: React.ReactNode;
    }) => (
        <button onClick={onClick} disabled={disabled} title={title} style={{
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 10, border: 'none', cursor: disabled ? 'default' : 'pointer', fontSize: 16,
            background: danger ? 'rgba(220,38,38,0.15)' : active ? 'rgba(99,102,241,0.3)' : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
            color: danger ? '#ef4444' : active ? '#a5b4fc' : disabled ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') : (isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)'),
            transition: 'all 0.15s', boxShadow: active ? '0 0 0 1px rgba(99,102,241,0.5)' : 'none',
        }}
                onMouseEnter={(e) => { if (disabled) return; Object.assign(e.currentTarget.style, { background: danger ? 'rgba(220,38,38,0.3)' : active ? 'rgba(99,102,241,0.45)' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }); }}
                onMouseLeave={(e) => { Object.assign(e.currentTarget.style, { background: danger ? 'rgba(220,38,38,0.15)' : active ? 'rgba(99,102,241,0.3)' : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }); }}
        >{children}</button>
    );

    const Divider = () => <div style={{ width: 32, height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', margin: '4px 0' }} />;

    const DrawColorDot = () => (
        <div title="Couleur du trait" style={{
            width: 20, height: 20, borderRadius: '50%',
            background: drawColor, border: '2px solid rgba(255,255,255,0.3)',
            cursor: 'pointer', position: 'relative',
        }}>
            <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)}
                   style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
        </div>
    );

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: c.canvasBg, position: 'relative', transition: 'background-color 0.3s' }}>

            {/* Dot grid */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
                backgroundImage: isDark ? 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)' : 'radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
                backgroundPosition: `${stagePos.x % 28}px ${stagePos.y % 28}px`,
            }} />

            {/* Whiteboard name badge */}
            <div style={{
                position: 'fixed', top: 14, left: SIDEBAR_W + 16, zIndex: 200,
                background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(8px)', border: `1px solid ${c.border}`,
                color: c.textSecondary, padding: '5px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            }}>⬜ {whiteboardName}</div>

            {/* Toast */}
            {uploadSuccess && (
                <div style={{
                    position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(5,150,105,0.9)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(52,211,153,0.4)',
                    color: 'white', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999,
                }}>✅ Image ajoutée au canvas</div>
            )}

            {/* ── Vertical Sidebar ── */}
            <div style={{
                position: 'fixed', left: 0, top: 0, bottom: 0, width: SIDEBAR_W,
                background: isDark ? 'rgba(10,8,30,0.95)' : 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                borderRight: `1px solid ${c.border}`,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', padding: '12px 0', gap: 6,
                zIndex: 100, boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
                transition: 'background 0.3s, border-color 0.3s',
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(79,70,229,0.5)', marginBottom: 8, flexShrink: 0,
                }}>
                    <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                        <rect x="2"  y="2"  width="11" height="11" rx="3" fill="white" opacity="0.9" />
                        <rect x="15" y="2"  width="11" height="11" rx="3" fill="white" opacity="0.6" />
                        <rect x="2"  y="15" width="11" height="11" rx="3" fill="white" opacity="0.6" />
                        <rect x="15" y="15" width="11" height="11" rx="3" fill="white" opacity="0.3" />
                    </svg>
                </div>

                <Divider />

                <div style={{ fontSize: 10, fontWeight: 700, color: c.textMuted, letterSpacing: 0.3, textAlign: 'center', lineHeight: 1.2 }}>
                    {Math.round(scale * 100)}%
                </div>
                <SideBtn onClick={handleResetView} title="Réinitialiser la vue">⌂</SideBtn>

                <Divider />

                <SideBtn onClick={undo} disabled={!canUndo} title="Annuler (Ctrl+Z)">↩</SideBtn>
                <SideBtn onClick={redo} disabled={!canRedo} title="Rétablir (Ctrl+Y)">↪</SideBtn>

                <Divider />

                <SideBtn onClick={() => setActiveTool('select')} active={activeTool === 'select'} title="Sélectionner (V)">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M2 1l12 7-6 1.5-2.5 5.5L2 1z"/>
                    </svg>
                </SideBtn>
                <SideBtn onClick={() => setActiveTool('draw')} active={activeTool === 'draw'} title="Crayon (P)">✏️</SideBtn>
                {activeTool === 'draw' && <DrawColorDot />}
                <SideBtn onClick={() => setActiveTool('rect')}   active={activeTool === 'rect'}   title="Rectangle (R)">▭</SideBtn>
                <SideBtn onClick={() => setActiveTool('circle')} active={activeTool === 'circle'} title="Ellipse (O)">◯</SideBtn>
                <SideBtn onClick={() => setActiveTool('arrow')}  active={activeTool === 'arrow'}  title="Flèche (A)">↗</SideBtn>

                <Divider />

                <SideBtn onClick={() => { setActiveTool('select'); fileInputRef.current?.click(); }} title="Ajouter une image">
                    {uploading ? '⏳' : '🖼'}
                </SideBtn>
                <SideBtn onClick={() => { setActiveTool('select'); addTextAtCenter(); }} title="Ajouter du texte">T</SideBtn>

                {selected && activeTool === 'select' && (
                    <>
                        <Divider />
                        <SideBtn onClick={() => moveZ(1)}         title="Avancer">↑</SideBtn>
                        <SideBtn onClick={() => moveZ(-1)}        title="Reculer">↓</SideBtn>
                        <SideBtn onClick={handleDuplicate}        title="Dupliquer (Ctrl+D)">⧉</SideBtn>
                        <SideBtn onClick={handleToggleLock}       active={!!selectedLocked} title={selectedLocked ? 'Déverrouiller (L)' : 'Verrouiller (L)'}>
                            {selectedLocked ? '🔒' : '🔓'}
                        </SideBtn>
                        <SideBtn onClick={handleDelete}           danger title="Supprimer (Suppr)">🗑</SideBtn>
                    </>
                )}

                <Divider />

                <SideBtn onClick={() => handleExport('png')}  title="Exporter PNG">PNG</SideBtn>
                <SideBtn onClick={() => handleExport('jpeg')} title="Exporter JPEG">JPG</SideBtn>

                <div style={{ flex: 1 }} />

                <SideBtn onClick={toggleTheme} title={isDark ? 'Mode clair' : 'Mode sombre'}>
                    {isDark ? '☀️' : '🌙'}
                </SideBtn>
                <SideBtn onClick={() => setShowHelp((v) => !v)} title="Raccourcis clavier (?)">?</SideBtn>
                <SideBtn onClick={onBackToDashboard} title="Retour au dashboard">⬅</SideBtn>

                <div onClick={onLogout} title="Déconnexion" style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: 14, color: 'white', fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(79,70,229,0.4)', transition: 'transform 0.15s', marginTop: 4,
                }}
                     onMouseEnter={(e) => Object.assign(e.currentTarget.style, { transform: 'scale(1.1)' })}
                     onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'scale(1)' })}
                >⏻</div>
            </div>

            {/* Hint bar */}
            <div style={{
                position: 'fixed', bottom: 16, left: SIDEBAR_W + 16, zIndex: 200,
                background: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)',
                color: c.textMuted, padding: '6px 14px', borderRadius: 8, fontSize: 11,
                backdropFilter: 'blur(8px)', border: `1px solid ${c.border}`,
            }}>
                {activeTool === 'select' && '🖱 Molette zoom · Glisser déplacer · Dbl-clic → texte · ? aide'}
                {activeTool === 'draw'   && '✏️ Cliquer-glisser pour dessiner · V pour revenir à la sélection'}
                {activeTool === 'rect'   && '▭ Cliquer-glisser pour tracer un rectangle · V pour sélection'}
                {activeTool === 'circle' && '◯ Cliquer-glisser pour tracer une ellipse · V pour sélection'}
                {activeTool === 'arrow'  && '↗ Cliquer-glisser pour tracer une flèche · V pour sélection'}
            </div>

            {/* Help overlay */}
            {showHelp && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                    zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={() => setShowHelp(false)}>
                    <div style={{
                        background: c.bgModal, border: `1px solid ${c.border}`,
                        borderRadius: 20, padding: 32, width: 460, boxShadow: c.shadowLg,
                    }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 20px', color: c.accentText, fontWeight: 800, fontSize: 20 }}>
                            ⌨️ Raccourcis clavier
                        </h2>
                        {[
                            ['V',                 'Outil sélection'],
                            ['P',                 'Outil crayon (dessin libre)'],
                            ['R',                 'Outil rectangle'],
                            ['O',                 'Outil ellipse'],
                            ['A',                 'Outil flèche'],
                            ['Ctrl+Z',            'Annuler (Undo)'],
                            ['Ctrl+Y',            'Rétablir (Redo)'],
                            ['Ctrl+D',            'Dupliquer l\'élément'],
                            ['L',                 'Verrouiller / déverrouiller'],
                            ['Suppr / Backspace', 'Supprimer l\'élément'],
                            ['Échap',             'Désélectionner / outil sélection'],
                            ['?',                 'Afficher / masquer cette aide'],
                            ['Molette souris',    'Zoomer / dézoomer'],
                            ['Dbl-clic canvas',   'Ajouter du texte'],
                        ].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${c.border}` }}>
                                <code style={{ background: c.accentBg, border: `1px solid ${c.accentBorder}`, padding: '2px 10px', borderRadius: 6, fontSize: 12, color: c.accentText }}>{k}</code>
                                <span style={{ color: c.textSecondary, fontSize: 13 }}>{v}</span>
                            </div>
                        ))}
                        <button onClick={() => setShowHelp(false)} style={{
                            marginTop: 20, width: '100%', padding: '11px',
                            background: c.accent, color: 'white', border: 'none',
                            borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14,
                        }}>Fermer</button>
                    </div>
                </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
                   style={{ display: 'none' }} onChange={handleUpload} />

            {/* ── Canvas ── */}
            <Stage
                ref={stageRef}
                width={dimensions.w - SIDEBAR_W}
                height={dimensions.h}
                scaleX={scale} scaleY={scale}
                x={stagePos.x} y={stagePos.y}
                draggable={stageDraggable}
                onWheel={handleWheel}
                onClick={handleStageClick}
                onDblClick={handleStageDblClick}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
                onDragEnd={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
                style={{ marginLeft: SIDEBAR_W, background: 'transparent', cursor: stageCursor }}
            >
                <Layer>
                    {allNodes.map((node) => {
                        if (node.type === 'image') {
                            const img = node.data as IImageNode;
                            return (
                                <ImageNodeComponent key={`img-${img.id}`} image={img}
                                                    isSelected={selected?.type === 'image' && selected.id === img.id}
                                                    onSelect={() => { if (activeTool === 'select') setSelected({ type: 'image', id: img.id }); }}
                                                    onChange={(u) => handleImageChange(img.id, u)} />
                            );
                        }
                        if (node.type === 'text') {
                            const t = node.data as ITextNode;
                            return (
                                <TextNodeComponent key={`txt-${t.id}`} node={t}
                                                   isSelected={selected?.type === 'text' && selected.id === t.id}
                                                   onSelect={() => { if (activeTool === 'select') setSelected({ type: 'text', id: t.id }); }}
                                                   onChange={(u) => handleTextChange(t.id, u)} />
                            );
                        }
                        if (node.type === 'drawing') {
                            const d = node.data as IDrawingNode;
                            return (
                                <DrawingNodeComponent key={`drw-${d.id}`} drawing={d}
                                                      isSelected={selected?.type === 'drawing' && selected.id === d.id}
                                                      onSelect={() => { if (activeTool === 'select') setSelected({ type: 'drawing', id: d.id }); }}
                                                      onChange={(u) => handleDrawingChange(d.id, u)} />
                            );
                        }
                        const s = node.data as IShapeNode;
                        return (
                            <ShapeNodeComponent key={`shp-${s.id}`} shape={s}
                                                isSelected={selected?.type === 'shape' && selected.id === s.id}
                                                onSelect={() => { if (activeTool === 'select') setSelected({ type: 'shape', id: s.id }); }}
                                                onChange={(u) => handleShapeChange(s.id, u)} />
                        );
                    })}

                    {currentDrawing && currentDrawing.length >= 4 && (
                        
                        <Line
                            points={currentDrawing}
                            stroke={drawColor}
                            strokeWidth={drawStrokeWidth}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            globalCompositeOperation="source-over"
                            listening={false}
                        />
                    )}

                    {previewShape && (
                        <ShapeNodeComponent
                            shape={previewShape}
                            isSelected={false}
                            onSelect={() => {}}
                            onChange={() => {}}
                        />
                    )}
                </Layer>
            </Stage>

            {selectedImage   && <PropertiesBar type="image"   node={selectedImage}   onChange={(u) => handleImageChange(selectedImage.id, u)} />}
            {selectedText    && <PropertiesBar type="text"    node={selectedText}    onChange={(u) => handleTextChange(selectedText.id, u)} />}
            {selectedDrawing && <PropertiesBar type="drawing" node={selectedDrawing} onChange={(u) => handleDrawingChange(selectedDrawing.id, u)} />}
            {selectedShape   && <PropertiesBar type="shape"   node={selectedShape}   onChange={(u) => handleShapeChange(selectedShape.id, u)} />}

            <Minimap images={images} texts={texts} stageX={stagePos.x} stageY={stagePos.y}
                     stageScale={scale} viewportWidth={dimensions.w - SIDEBAR_W} viewportHeight={dimensions.h} />
        </div>
    );
};

export default Whiteboard;