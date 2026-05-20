import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// On étend Request pour pouvoir y attacher l'id de l'utilisateur connecté
export interface AuthRequest extends Request {
    userId?: number;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Le token est envoyé dans le header Authorization: Bearer <token>
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Token manquant' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
        // On stocke l'id dans la requête pour les routes suivantes
        req.userId = decoded.userId;
        next();
    } catch {
        res.status(401).json({ error: 'Token invalide' });
    }
};