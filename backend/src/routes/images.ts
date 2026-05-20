import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadsDir = path.join(__dirname, '../../uploads');
        console.log('UPLOADS DIR:', uploadsDir);
        console.log('DIR EXISTS:', fs.existsSync(uploadsDir));
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/png', 'image/jpeg', 'image/webp'];
        cb(null, allowed.includes(file.mimetype));
    },
});

router.use(authMiddleware);

// GET /api/images?whiteboardId=X
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    const whiteboardId = parseInt(req.query.whiteboardId as string);
    if (!whiteboardId) { res.status(400).json({ error: 'whiteboardId requis' }); return; }
    try {
        // Vérifier que le whiteboard appartient à l'utilisateur
        const wb = await prisma.whiteboard.findFirst({ where: { id: whiteboardId, userId: req.userId! } });
        if (!wb) { res.status(403).json({ error: 'Accès refusé' }); return; }
        const images = await prisma.imageNode.findMany({ where: { whiteboardId } });
        res.json(images);
    } catch (err) {
        console.error('GET IMAGES ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST /api/images/upload?whiteboardId=X
router.post('/upload', upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
    const whiteboardId = parseInt(req.query.whiteboardId as string);
    console.log('UPLOAD HIT — req.file:', req.file, '— whiteboardId:', whiteboardId);
    if (!req.file) { res.status(400).json({ error: 'Fichier invalide' }); return; }
    if (!whiteboardId) { res.status(400).json({ error: 'whiteboardId requis' }); return; }
    try {
        // Vérifier que le whiteboard appartient à l'utilisateur
        const wb = await prisma.whiteboard.findFirst({ where: { id: whiteboardId, userId: req.userId! } });
        if (!wb) { res.status(403).json({ error: 'Accès refusé' }); return; }

        const image = await prisma.imageNode.create({
            data: {
                userId: req.userId!,
                whiteboardId,
                url: `/uploads/${req.file.filename}`,
                x: 100, y: 100, width: 200, height: 200, rotation: 0, zIndex: 0,
                opacity: 1, brightness: 1, contrast: 1, saturation: 1,
                blur: 0, grayscale: 0, sepia: 0, locked: false,
            },
        });

        // Mettre à jour updatedAt du whiteboard
        await prisma.whiteboard.update({ where: { id: whiteboardId }, data: { updatedAt: new Date() } });

        res.status(201).json(image);
    } catch (err) {
        console.error('UPLOAD ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    const {
        x, y, width, height, rotation, zIndex,
        opacity, brightness, contrast, saturation,
        blur, grayscale, sepia, locked,
    } = req.body;
    try {
        const image = await prisma.imageNode.findFirst({ where: { id, userId: req.userId! } });
        if (!image) { res.status(404).json({ error: 'Image non trouvée' }); return; }
        const updated = await prisma.imageNode.update({
            where: { id },
            data: { x, y, width, height, rotation, zIndex, opacity, brightness, contrast, saturation, blur, grayscale, sepia, locked },
        });
        // Mettre à jour updatedAt du whiteboard
        await prisma.whiteboard.update({ where: { id: image.whiteboardId }, data: { updatedAt: new Date() } });
        res.json(updated);
    } catch (err) {
        console.error('UPDATE IMAGE ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    try {
        const image = await prisma.imageNode.findFirst({ where: { id, userId: req.userId! } });
        if (!image) { res.status(404).json({ error: 'Image non trouvée' }); return; }
        const filePath = path.join(__dirname, '../../uploads', path.basename(image.url));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        await prisma.imageNode.delete({ where: { id } });
        await prisma.whiteboard.update({ where: { id: image.whiteboardId }, data: { updatedAt: new Date() } });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE IMAGE ERROR:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
