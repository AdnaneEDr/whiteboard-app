import { useRef } from 'react';
import { Line, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { IDrawingNode } from '../../types';

interface Props {
    drawing: IDrawingNode;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (u: Partial<IDrawingNode>) => void;
}

const DrawingNodeComponent = ({ drawing, isSelected, onSelect, onChange }: Props) => {
    const lineRef  = useRef<Konva.Line>(null);
    const trRef    = useRef<Konva.Transformer>(null);

    // Attach transformer when selected
    if (isSelected && trRef.current && lineRef.current) {
        trRef.current.nodes([lineRef.current]);
        trRef.current.getLayer()?.batchDraw();
    }

    return (
        <>
            <Line
                ref={lineRef}
                points={drawing.points}
                stroke={drawing.color}
                strokeWidth={drawing.strokeWidth}
                opacity={drawing.opacity}
                tension={drawing.tension ?? 0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="source-over"
                draggable={!drawing.locked}
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={(e) => {
                    // When dragged, offset all points by the delta
                    const node = e.target as Konva.Line;
                    onChange({ points: drawing.points });
                    node.position({ x: 0, y: 0 });
                }}
                hitStrokeWidth={Math.max(drawing.strokeWidth, 10)}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    rotateEnabled={false}
                    enabledAnchors={[]}
                    borderStroke="#6366f1"
                    borderDash={[4, 2]}
                />
            )}
        </>
    );
};

export default DrawingNodeComponent;
