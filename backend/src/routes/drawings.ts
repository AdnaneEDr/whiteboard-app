import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/drawings?whiteboardId=X
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    const whiteboardId = parseInt((req.query.whiteboardId ?? '') as string);
    if (!whiteboardId) { res.status(400).json({ error: 'whiteboardId requis' }); return; }
    try {
        const wb = await prisma.whiteboard.findFirst({ where: { id: whiteboardId, userId: req.userId! } });
        if (!wb) { res.status(403).json({ error: 'Accès refusé' }); return; }
        const drawings = await prisma.drawingNode.findMany({ where: { whiteboardId } });
        const parsed = drawings.map((d) => ({ ...d, points: JSON.parse(d.points) }));
        res.json(parsed);
    } catch (err) {
        console.error('GET DRAWINGS ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST /api/drawings?whiteboardId=X
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    const whiteboardId = parseInt((req.query.whiteboardId ?? '') as string);
    if (!whiteboardId) { res.status(400).json({ error: 'whiteboardId requis' }); return; }
    const { points, color, strokeWidth, opacity, zIndex, tension, locked } = req.body;
    try {
        const wb = await prisma.whiteboard.findFirst({ where: { id: whiteboardId, userId: req.userId! } });
        if (!wb) { res.status(403).json({ error: 'Accès refusé' }); return; }
        const drawing = await prisma.drawingNode.create({
            data: {
                userId: req.userId!,
                whiteboardId,
                points: JSON.stringify(points ?? []),
                color: color ?? '#ffffff',
                strokeWidth: strokeWidth ?? 4,
                opacity: opacity ?? 1,
                zIndex: zIndex ?? 0,
                tension: tension ?? 0.5,
                locked: locked ?? false,
            },
        });
        await prisma.whiteboard.update({ where: { id: whiteboardId }, data: { updatedAt: new Date() } });
        res.status(201).json({ ...drawing, points: JSON.parse(drawing.points) });
    } catch (err) {
        console.error('CREATE DRAWING ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT /api/drawings/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    const { points, color, strokeWidth, opacity, zIndex, tension, locked } = req.body;
    try {
        const drawing = await prisma.drawingNode.findFirst({ where: { id, userId: req.userId! } });
        if (!drawing) { res.status(404).json({ error: 'Dessin non trouvé' }); return; }
        const updated = await prisma.drawingNode.update({
            where: { id },
            data: {
                ...(points !== undefined && { points: JSON.stringify(points) }),
                ...(color !== undefined && { color }),
                ...(strokeWidth !== undefined && { strokeWidth }),
                ...(opacity !== undefined && { opacity }),
                ...(zIndex !== undefined && { zIndex }),
                ...(tension !== undefined && { tension }),
                ...(locked !== undefined && { locked }),
            },
        });
        await prisma.whiteboard.update({ where: { id: drawing.whiteboardId }, data: { updatedAt: new Date() } });
        res.json({ ...updated, points: JSON.parse(updated.points) });
    } catch (err) {
        console.error('UPDATE DRAWING ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE /api/drawings/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    try {
        const drawing = await prisma.drawingNode.findFirst({ where: { id, userId: req.userId! } });
        if (!drawing) { res.status(404).json({ error: 'Dessin non trouvé' }); return; }
        await prisma.drawingNode.delete({ where: { id } });
        await prisma.whiteboard.update({ where: { id: drawing.whiteboardId }, data: { updatedAt: new Date() } });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE DRAWING ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;