import { useEffect, useRef, useState } from 'react';
import { Text, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { ITextNode } from '../../types';

interface Props {
    node: ITextNode;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (updated: Partial<ITextNode>) => void;
}

const TextNodeComponent = ({ node, isSelected, onSelect, onChange }: Props) => {
    const textRef        = useRef<Konva.Text>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    const [editing, setEditing]   = useState(false);

    useEffect(() => {
        if (isSelected && transformerRef.current && textRef.current) {
            transformerRef.current.nodes([textRef.current]);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    const handleDblClick = () => {
        if (node.locked) return;
        const textNode = textRef.current!;
        const stage    = textNode.getStage()!;
        const stageBox = stage.container().getBoundingClientRect();
        const absPos   = textNode.getAbsolutePosition();
        const stageScale = stage.scaleX();

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);

        textarea.value = node.text;
        textarea.style.position       = 'fixed';
        textarea.style.top            = `${stageBox.top + absPos.y}px`;
        textarea.style.left           = `${stageBox.left + absPos.x}px`;
        textarea.style.minWidth       = `${Math.max(200, textNode.width() * stageScale)}px`;
        textarea.style.minHeight      = '40px';
        textarea.style.fontSize       = `${node.fontSize * stageScale}px`;
        textarea.style.fontFamily     = node.fontFamily || 'sans-serif';
        textarea.style.fontWeight     = (node.fontStyle || '').includes('bold')   ? 'bold'   : 'normal';
        textarea.style.fontStyle      = (node.fontStyle || '').includes('italic') ? 'italic' : 'normal';
        textarea.style.textAlign      = node.align || 'left';
        textarea.style.lineHeight     = '1.4';
        // ── FIX: always use readable contrast: dark background + white text ──
        textarea.style.background     = 'rgba(15, 12, 41, 0.95)';
        textarea.style.color          = '#ffffff';
        textarea.style.caretColor     = '#a5b4fc';
        textarea.style.border         = '2px solid #4f46e5';
        textarea.style.borderRadius   = '6px';
        textarea.style.padding        = '6px 10px';
        textarea.style.outline        = 'none';
        textarea.style.resize         = 'none';
        textarea.style.zIndex         = '9999';
        textarea.style.overflow       = 'hidden';
        textarea.style.boxShadow      = '0 4px 24px rgba(79,70,229,0.5)';
        textarea.style.backdropFilter = 'blur(8px)';
        textarea.focus();
        textarea.select();

        setEditing(true);

        const finish = () => {
            if (!document.body.contains(textarea)) return;
            const newText = textarea.value || node.text;
            document.body.removeChild(textarea);
            setEditing(false);
            if (newText !== node.text) onChange({ text: newText });
        };

        textarea.addEventListener('blur', finish);
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { finish(); }
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finish(); }
        });
    };

    return (
        <>
            <Text
                ref={textRef}
                text={node.text}
                x={node.x}
                y={node.y}
                fontSize={node.fontSize}
                fill={node.color}
                fontFamily={node.fontFamily || 'sans-serif'}
                fontStyle={node.fontStyle || 'normal'}
                align={node.align || 'left'}
                rotation={node.rotation}
                draggable={!node.locked}
                visible={!editing}
                onClick={onSelect}
                onTap={onSelect}
                onDblClick={handleDblClick}
                onDblTap={handleDblClick}
                onDragEnd={(e) => {
                    if (node.locked) return;
                    onChange({ x: e.target.x(), y: e.target.y() });
                }}
                onTransformEnd={() => {
                    if (node.locked) return;
                    const n = textRef.current!;
                    onChange({
                        x: n.x(),
                        y: n.y(),
                        fontSize: Math.max(8, node.fontSize * n.scaleX()),
                        rotation: n.rotation(),
                    });
                    n.scaleX(1);
                    n.scaleY(1);
                }}
            />
            {isSelected && !editing && (
                <Transformer
                    ref={transformerRef}
                    enabledAnchors={node.locked ? [] : ['middle-left', 'middle-right']}
                    rotateEnabled={!node.locked}
                    boundBoxFunc={(oldBox, newBox) =>
                        newBox.width < 20 ? oldBox : newBox
                    }
                    borderStroke={node.locked ? '#f59e0b' : '#4f46e5'}
                    borderStrokeWidth={node.locked ? 2 : 1.5}
                />
            )}
        </>
    );
};

export default TextNodeComponent;
