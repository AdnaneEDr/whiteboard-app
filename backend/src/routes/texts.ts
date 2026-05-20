import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/texts?whiteboardId=X
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    const whiteboardId = parseInt(req.query.whiteboardId as string);
    if (!whiteboardId) { res.status(400).json({ error: 'whiteboardId requis' }); return; }
    try {
        const wb = await prisma.whiteboard.findFirst({ where: { id: whiteboardId, userId: req.userId! } });
        if (!wb) { res.status(403).json({ error: 'Accès refusé' }); return; }
        const texts = await prisma.textNode.findMany({ where: { whiteboardId } });
        res.json(texts);
    } catch (err) {
        console.error('GET TEXTS ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    const whiteboardId = parseInt(req.query.whiteboardId as string);
    if (!whiteboardId) { res.status(400).json({ error: 'whiteboardId requis' }); return; }
    const {
        text, x, y,
        fontSize = 20, color = '#ffffff',
        fontFamily = 'sans-serif', fontStyle = 'normal',
        align = 'left', locked = false,
    } = req.body;
    if (!text) { res.status(400).json({ error: 'Texte requis' }); return; }
    try {
        const wb = await prisma.whiteboard.findFirst({ where: { id: whiteboardId, userId: req.userId! } });
        if (!wb) { res.status(403).json({ error: 'Accès refusé' }); return; }
        const node = await prisma.textNode.create({
            data: {
                userId: req.userId!, whiteboardId,
                text, x, y, fontSize, color,
                fontFamily, fontStyle, align, locked,
                rotation: 0, zIndex: 0,
            },
        });
        await prisma.whiteboard.update({ where: { id: whiteboardId }, data: { updatedAt: new Date() } });
        res.status(201).json(node);
    } catch (err) {
        console.error('CREATE TEXT ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    const { text, x, y, fontSize, color, fontFamily, fontStyle, align, rotation, zIndex, locked } = req.body;
    try {
        const node = await prisma.textNode.findFirst({ where: { id, userId: req.userId! } });
        if (!node) { res.status(404).json({ error: 'Texte non trouvé' }); return; }
        const updated = await prisma.textNode.update({
            where: { id },
            data: { text, x, y, fontSize, color, fontFamily, fontStyle, align, rotation, zIndex, locked },
        });
        await prisma.whiteboard.update({ where: { id: node.whiteboardId }, data: { updatedAt: new Date() } });
        res.json(updated);
    } catch (err) {
        console.error('UPDATE TEXT ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    try {
        const node = await prisma.textNode.findFirst({ where: { id, userId: req.userId! } });
        if (!node) { res.status(404).json({ error: 'Texte non trouvé' }); return; }
        await prisma.textNode.delete({ where: { id } });
        await prisma.whiteboard.update({ where: { id: node.whiteboardId }, data: { updatedAt: new Date() } });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE TEXT ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
