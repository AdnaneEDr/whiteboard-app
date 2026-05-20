import { useRef, useEffect } from 'react';
import { Rect, Ellipse, Arrow, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { IShapeNode } from '../../types';

interface Props {
    shape: IShapeNode;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (u: Partial<IShapeNode>) => void;
}

const ShapeNodeComponent = ({ shape, isSelected, onSelect, onChange }: Props) => {
    const shapeRef = useRef<Konva.Shape>(null);
    const trRef    = useRef<Konva.Transformer>(null);

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    const commonProps = {
        draggable: !shape.locked,
        opacity:   shape.opacity,
        stroke:    shape.stroke,
        strokeWidth: shape.strokeWidth,
        onClick:   onSelect,
        onTap:     onSelect,
        onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
            onChange({ x: e.target.x(), y: e.target.y() });
        },
        onTransformEnd: () => {
            const node = shapeRef.current!;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            onChange({
                x:        node.x(),
                y:        node.y(),
                width:    Math.max(10, (shape.width)  * scaleX),
                height:   Math.max(10, (shape.height) * scaleY),
                rotation: node.rotation(),
            });
        },
    };

    const renderShape = () => {
        if (shape.type === 'rect') {
            return (
                <Rect
                    ref={shapeRef as React.RefObject<Konva.Rect>}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    rotation={shape.rotation}
                    fill={shape.fill === 'transparent' ? undefined : shape.fill}
                    cornerRadius={4}
                    {...commonProps}
                />
            );
        }

        if (shape.type === 'circle') {
            return (
                <Ellipse
                    ref={shapeRef as React.RefObject<Konva.Ellipse>}
                    x={shape.x + shape.width / 2}
                    y={shape.y + shape.height / 2}
                    radiusX={shape.width / 2}
                    radiusY={shape.height / 2}
                    rotation={shape.rotation}
                    fill={shape.fill === 'transparent' ? undefined : shape.fill}
                    {...commonProps}
                    onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
                        // Ellipse position is center-based; convert back to top-left
                        onChange({
                            x: e.target.x() - shape.width / 2,
                            y: e.target.y() - shape.height / 2,
                        });
                    }}
                    onTransformEnd={() => {
                        const node = shapeRef.current as Konva.Ellipse;
                        const scaleX = node.scaleX();
                        const scaleY = node.scaleY();
                        node.scaleX(1);
                        node.scaleY(1);
                        const newW = Math.max(10, shape.width  * scaleX);
                        const newH = Math.max(10, shape.height * scaleY);
                        node.radiusX(newW / 2);
                        node.radiusY(newH / 2);
                        onChange({
                            x:        node.x() - newW / 2,
                            y:        node.y() - newH / 2,
                            width:    newW,
                            height:   newH,
                            rotation: node.rotation(),
                        });
                    }}
                />
            );
        }

        // arrow
        return (
            <Arrow
                ref={shapeRef as React.RefObject<Konva.Arrow>}
                x={shape.x}
                y={shape.y}
                points={[0, 0, shape.width, shape.height]}
                rotation={shape.rotation}
                fill={shape.stroke}
                pointerLength={12}
                pointerWidth={10}
                {...commonProps}
            />
        );
    };

    return (
        <>
            {renderShape()}
            {isSelected && (
                <Transformer
                    ref={trRef}
                    rotateEnabled
                    enabledAnchors={shape.type === 'arrow'
                        ? ['middle-right', 'middle-left']
                        : ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-right', 'middle-left', 'top-center', 'bottom-center']
                    }
                    borderStroke="#6366f1"
                    anchorStroke="#6366f1"
                    anchorFill="#fff"
                    anchorCornerRadius={3}
                />
            )}
        </>
    );
};

export default ShapeNodeComponent;
