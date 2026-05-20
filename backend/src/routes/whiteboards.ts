import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// Lister tous les whiteboards de l'utilisateur
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const whiteboards = await prisma.whiteboard.findMany({
            where: { userId: req.userId! },
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: { select: { images: true, texts: true } },
            },
        });
        res.json(whiteboards);
    } catch (err) {
        console.error('GET WHITEBOARDS ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Créer un nouveau whiteboard
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    const { name = 'Nouveau tableau' } = req.body;
    try {
        const whiteboard = await prisma.whiteboard.create({
            data: { userId: req.userId!, name },
            include: {
                _count: { select: { images: true, texts: true } },
            },
        });
        res.status(201).json(whiteboard);
    } catch (err) {
        console.error('CREATE WHITEBOARD ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Renommer un whiteboard
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    const { name } = req.body;
    try {
        const wb = await prisma.whiteboard.findFirst({ where: { id, userId: req.userId! } });
        if (!wb) { res.status(404).json({ error: 'Tableau non trouvé' }); return; }
        const updated = await prisma.whiteboard.update({
            where: { id },
            data: { name },
            include: { _count: { select: { images: true, texts: true } } },
        });
        res.json(updated);
    } catch (err) {
        console.error('UPDATE WHITEBOARD ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer un whiteboard (et tous ses éléments)
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    try {
        const wb = await prisma.whiteboard.findFirst({ where: { id, userId: req.userId! } });
        if (!wb) { res.status(404).json({ error: 'Tableau non trouvé' }); return; }
        // Supprimer les éléments liés d'abord
        await prisma.imageNode.deleteMany({ where: { whiteboardId: id } });
        await prisma.textNode.deleteMany({ where: { whiteboardId: id } });
        await prisma.whiteboard.delete({ where: { id } });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE WHITEBOARD ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
