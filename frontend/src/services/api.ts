import axios from 'axios';
import type { IImageNode, ITextNode, IDrawingNode, IShapeNode } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Auth ──────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
    api.post('/api/auth/login', { email, password });

export const register = (email: string, password: string) =>
    api.post('/api/auth/register', { email, password });

// ── Whiteboards ───────────────────────────────────────────────────────
export const getWhiteboards = () =>
    api.get('/api/whiteboards');

export const createWhiteboard = (name: string) =>
    api.post('/api/whiteboards', { name });

export const renameWhiteboard = (id: number, name: string) =>
    api.put(`/api/whiteboards/${id}`, { name });

export const deleteWhiteboard = (id: number) =>
    api.delete(`/api/whiteboards/${id}`);

// ── Images ────────────────────────────────────────────────────────────
export const getImages = (whiteboardId: number) =>
    api.get('/api/images', { params: { whiteboardId } });

export const uploadImage = (file: File, whiteboardId: number) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/api/images/upload', formData, { params: { whiteboardId } });
};

export const updateImage = (id: number, data: Partial<IImageNode>) =>
    api.put(`/api/images/${id}`, data);

export const deleteImage = (id: number) =>
    api.delete(`/api/images/${id}`);

// ── Texts ─────────────────────────────────────────────────────────────
export const getTexts = (whiteboardId: number) =>
    api.get('/api/texts', { params: { whiteboardId } });

export const createText = (
    data: Partial<ITextNode> & { text: string; x: number; y: number },
    whiteboardId: number,
) => api.post('/api/texts', data, { params: { whiteboardId } });

export const updateText = (id: number, data: Partial<ITextNode>) =>
    api.put(`/api/texts/${id}`, data);

export const deleteText = (id: number) =>
    api.delete(`/api/texts/${id}`);

// ── Drawings ──────────────────────────────────────────────────────────
export const getDrawings = (whiteboardId: number) =>
    api.get('/api/drawings', { params: { whiteboardId } });

export const createDrawing = (
    data: Partial<IDrawingNode> & { points: number[] },
    whiteboardId: number,
) => api.post('/api/drawings', data, { params: { whiteboardId } });

export const updateDrawing = (id: number, data: Partial<IDrawingNode>) =>
    api.put(`/api/drawings/${id}`, data);

export const deleteDrawing = (id: number) =>
    api.delete(`/api/drawings/${id}`);

// ── Shapes ────────────────────────────────────────────────────────────
export const getShapes = (whiteboardId: number) =>
    api.get('/api/shapes', { params: { whiteboardId } });

export const createShape = (
    data: Partial<IShapeNode> & { type: 'rect' | 'circle' | 'arrow'; x: number; y: number },
    whiteboardId: number,
) => api.post('/api/shapes', data, { params: { whiteboardId } });

export const updateShape = (id: number, data: Partial<IShapeNode>) =>
    api.put(`/api/shapes/${id}`, data);

export const deleteShape = (id: number) =>
    api.delete(`/api/shapes/${id}`);
