import { useEffect, useRef } from 'react';
import type { IImageNode, ITextNode } from '../../types';

interface Props {
    images: IImageNode[];
    texts: ITextNode[];
    stageX: number;
    stageY: number;
    stageScale: number;
    viewportWidth: number;
    viewportHeight: number;
}

const MINIMAP_W = 180;
const MINIMAP_H = 120;
const WORLD_W = 4000;
const WORLD_H = 3000;
const SIDEBAR_W = 64;

const Minimap = ({ images, texts, stageX, stageY, stageScale, viewportWidth, viewportHeight }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const scaleX = MINIMAP_W / WORLD_W;
        const scaleY = MINIMAP_H / WORLD_H;

        ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H);

        ctx.fillStyle = '#1e1e2e';
        ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H);

        ctx.fillStyle = '#4f46e5';
        images.forEach((img) => {
            ctx.fillRect(
                img.x * scaleX,
                img.y * scaleY,
                Math.max(4, img.width * scaleX),
                Math.max(4, img.height * scaleY)
            );
        });

        ctx.fillStyle = '#a78bfa';
        texts.forEach((t) => {
            ctx.fillRect(t.x * scaleX, t.y * scaleY, 20 * scaleX, 8 * scaleY);
        });

        const vpX = (-stageX / stageScale) * scaleX;
        const vpY = (-stageY / stageScale) * scaleY;
        const vpW = (viewportWidth / stageScale) * scaleX;
        const vpH = (viewportHeight / stageScale) * scaleY;

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(vpX, vpY, vpW, vpH);
    }, [images, texts, stageX, stageY, stageScale, viewportWidth, viewportHeight]);

    return (
        <div style={{
            position: 'fixed',
            bottom: 60,          // above hint bar
            left: SIDEBAR_W + 16, // aligned with hint bar, no collision with PropertiesBar
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
            zIndex: 200,
        }}>
            <div style={{
                background: '#12121f',
                padding: '4px 8px',
                fontSize: 10,
                color: '#a78bfa',
                fontFamily: 'monospace',
                letterSpacing: 1,
            }}>
                MINIMAP
            </div>
            <canvas ref={canvasRef} width={MINIMAP_W} height={MINIMAP_H} />
        </div>
    );
};

export default Minimap;
