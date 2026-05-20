import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/shapes?whiteboardId=X
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    const whiteboardId = parseInt((req.query.whiteboardId ?? '') as string);
    if (!whiteboardId) { res.status(400).json({ error: 'whiteboardId requis' }); return; }
    try {
        const wb = await prisma.whiteboard.findFirst({ where: { id: whiteboardId, userId: req.userId! } });
        if (!wb) { res.status(403).json({ error: 'Accès refusé' }); return; }
        const shapes = await prisma.shapeNode.findMany({ where: { whiteboardId } });
        res.json(shapes);
    } catch (err) {
        console.error('GET SHAPES ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST /api/shapes?whiteboardId=X
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    const whiteboardId = parseInt((req.query.whiteboardId ?? '') as string);
    if (!whiteboardId) { res.status(400).json({ error: 'whiteboardId requis' }); return; }
    const { type, x, y, width, height, rotation, fill, stroke, strokeWidth, opacity, zIndex, locked } = req.body;
    if (!type) { res.status(400).json({ error: 'type requis (rect | circle | arrow)' }); return; }
    try {
        const wb = await prisma.whiteboard.findFirst({ where: { id: whiteboardId, userId: req.userId! } });
        if (!wb) { res.status(403).json({ error: 'Accès refusé' }); return; }
        const shape = await prisma.shapeNode.create({
            data: {
                userId: req.userId!,
                whiteboardId,
                type,
                x: x ?? 100,
                y: y ?? 100,
                width: width ?? 150,
                height: height ?? 100,
                rotation: rotation ?? 0,
                fill: fill ?? 'transparent',
                stroke: stroke ?? '#ffffff',
                strokeWidth: strokeWidth ?? 2,
                opacity: opacity ?? 1,
                zIndex: zIndex ?? 0,
                locked: locked ?? false,
            },
        });
        await prisma.whiteboard.update({ where: { id: whiteboardId }, data: { updatedAt: new Date() } });
        res.status(201).json(shape);
    } catch (err) {
        console.error('CREATE SHAPE ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT /api/shapes/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    const { x, y, width, height, rotation, fill, stroke, strokeWidth, opacity, zIndex, locked } = req.body;
    try {
        const shape = await prisma.shapeNode.findFirst({ where: { id, userId: req.userId! } });
        if (!shape) { res.status(404).json({ error: 'Forme non trouvée' }); return; }
        const updated = await prisma.shapeNode.update({
            where: { id },
            data: {
                ...(x !== undefined && { x }),
                ...(y !== undefined && { y }),
                ...(width !== undefined && { width }),
                ...(height !== undefined && { height }),
                ...(rotation !== undefined && { rotation }),
                ...(fill !== undefined && { fill }),
                ...(stroke !== undefined && { stroke }),
                ...(strokeWidth !== undefined && { strokeWidth }),
                ...(opacity !== undefined && { opacity }),
                ...(zIndex !== undefined && { zIndex }),
                ...(locked !== undefined && { locked }),
            },
        });
        await prisma.whiteboard.update({ where: { id: shape.whiteboardId }, data: { updatedAt: new Date() } });
        res.json(updated);
    } catch (err) {
        console.error('UPDATE SHAPE ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE /api/shapes/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    try {
        const shape = await prisma.shapeNode.findFirst({ where: { id, userId: req.userId! } });
        if (!shape) { res.status(404).json({ error: 'Forme non trouvée' }); return; }
        await prisma.shapeNode.delete({ where: { id } });
        await prisma.whiteboard.update({ where: { id: shape.whiteboardId }, data: { updatedAt: new Date() } });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE SHAPE ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;