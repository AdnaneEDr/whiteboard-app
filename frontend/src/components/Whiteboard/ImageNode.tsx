import { useEffect, useRef } from 'react';
import { Image as KonvaImage, Transformer } from 'react-konva';
import Konva from 'konva';
import type { IImageNode } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Props {
    image: IImageNode;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (updated: Partial<IImageNode>) => void;
}

/**
 * Build a CSS filter string from the image node's filter properties.
 * Konva doesn't support brightness/contrast/saturation/grayscale/sepia natively,
 * so we re-draw the source image onto an offscreen canvas with CSS filter applied,
 * then use that canvas as the Konva image source.
 */
function buildCSSFilter(image: IImageNode): string {
    const b = image.brightness ?? 1;
    const c = image.contrast ?? 1;
    const s = image.saturation ?? 1;
    const bl = image.blur ?? 0;
    const gs = image.grayscale ?? 0;
    const sp = image.sepia ?? 0;

    const parts: string[] = [];
    if (b !== 1)  parts.push(`brightness(${b})`);
    if (c !== 1)  parts.push(`contrast(${c})`);
    if (s !== 1)  parts.push(`saturate(${s})`);
    if (bl > 0)   parts.push(`blur(${bl}px)`);
    if (gs > 0)   parts.push(`grayscale(${gs})`);
    if (sp > 0)   parts.push(`sepia(${sp})`);

    return parts.join(' ');
}

/**
 * Draw a source HTMLImageElement onto an offscreen canvas
 * with CSS filters applied, then return the canvas as the texture.
 */
function applyFilterToCanvas(
    src: HTMLImageElement,
    cssFilter: string,
    width: number,
    height: number
): HTMLCanvasElement {
    const offscreen = document.createElement('canvas');
    offscreen.width  = width  || src.naturalWidth  || 200;
    offscreen.height = height || src.naturalHeight || 200;
    const ctx = offscreen.getContext('2d')!;
    ctx.clearRect(0, 0, offscreen.width, offscreen.height);
    if (cssFilter) ctx.filter = cssFilter;
    ctx.drawImage(src, 0, 0, offscreen.width, offscreen.height);
    return offscreen;
}

const ImageNodeComponent = ({ image, isSelected, onSelect, onChange }: Props) => {
    const imageRef        = useRef<Konva.Image>(null);
    const transformerRef  = useRef<Konva.Transformer>(null);
    // Keep the raw HTMLImageElement separate from the texture source
    const rawImg          = useRef<HTMLImageElement>(new window.Image());
    // The canvas (or raw img) that Konva actually renders
    const textureRef      = useRef<HTMLCanvasElement | HTMLImageElement>(rawImg.current);

    // ── Load the image from the server ──────────────────────────────────
    useEffect(() => {
        rawImg.current.crossOrigin = 'anonymous';
        rawImg.current.src = `${API_URL}${image.url}`;
        rawImg.current.onload = () => {
            rebuildTexture();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [image.url]);

    // ── Rebuild texture whenever filters change ──────────────────────────
    const rebuildTexture = () => {
        const src = rawImg.current;
        if (!src.complete || !src.naturalWidth) return;

        const cssFilter = buildCSSFilter(image);
        if (cssFilter) {
            textureRef.current = applyFilterToCanvas(src, cssFilter, image.width, image.height);
        } else {
            textureRef.current = src;
        }

        const node = imageRef.current;
        if (node) {
            // Replace the image source and disable Konva's own filter pipeline
            node.image(textureRef.current);
            node.filters([]);
            node.clearCache();
            node.getLayer()?.batchDraw();
        }
    };

    useEffect(() => {
        rebuildTexture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        image.brightness, image.contrast, image.saturation,
        image.blur, image.grayscale, image.sepia,
        image.width, image.height,
    ]);

    // ── Transformer ──────────────────────────────────────────────────────
    useEffect(() => {
        if (isSelected && transformerRef.current && imageRef.current) {
            transformerRef.current.nodes([imageRef.current]);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    return (
        <>
            <KonvaImage
                ref={imageRef}
                id={`img-${image.id}`}
                image={textureRef.current as CanvasImageSource}
                x={image.x}
                y={image.y}
                width={image.width}
                height={image.height}
                rotation={image.rotation}
                opacity={image.opacity ?? 1}
                draggable={!image.locked}
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={(e) => {
                    if (image.locked) return;
                    onChange({ x: e.target.x(), y: e.target.y() });
                }}
                onTransformEnd={() => {
                    if (image.locked) return;
                    const node = imageRef.current!;
                    const newW = Math.max(20, node.width()  * node.scaleX());
                    const newH = Math.max(20, node.height() * node.scaleY());
                    onChange({
                        x: node.x(), y: node.y(),
                        width: newW, height: newH,
                        rotation: node.rotation(),
                    });
                    node.scaleX(1);
                    node.scaleY(1);
                    // Rebuild texture at new size so filter canvas matches
                    setTimeout(rebuildTexture, 0);
                }}
            />
            {isSelected && (
                <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) =>
                        newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
                    }
                    borderStroke={image.locked ? '#f59e0b' : '#4f46e5'}
                    borderStrokeWidth={image.locked ? 2 : 1.5}
                    rotateEnabled={!image.locked}
                    resizeEnabled={!image.locked}
                />
            )}
        </>
    );
};

export default ImageNodeComponent;
