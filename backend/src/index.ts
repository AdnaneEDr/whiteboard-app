import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import imageRoutes from './routes/images';
import textRoutes from './routes/texts';
import whiteboardRoutes from './routes/whiteboards';
import drawingRoutes from './routes/drawings';
import shapeRoutes from './routes/shapes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost'],
    credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/whiteboards', whiteboardRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/texts', textRoutes);
app.use('/api/drawings', drawingRoutes);
app.use('/api/shapes', shapeRoutes);

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
