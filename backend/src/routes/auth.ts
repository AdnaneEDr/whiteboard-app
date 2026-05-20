import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Inscription d'un nouvel utilisateur
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: 'Email et mot de passe requis' });
        return;
    }

    try {
        // On vérifie que l'email n'est pas déjà pris
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'Email déjà utilisé' });
            return;
        }

        // On hash le mot de passe avant de le stocker
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({ data: { email, passwordHash } });

        // On génère un token valable 7 jours
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
        res.status(201).json({ token, email: user.email });
    } catch {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Connexion d'un utilisateur existant
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: 'Email et mot de passe requis' });
        return;
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        // On renvoie le même message que l'utilisateur n'existe pas ou que le mot de passe est faux
        // pour ne pas donner d'indice à un attaquant
        if (!user) {
            res.status(401).json({ error: 'Identifiants invalides' });
            return;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            res.status(401).json({ error: 'Identifiants invalides' });
            return;
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
        res.json({ token, email: user.email });
    } catch {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;