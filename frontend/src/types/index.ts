export interface IWhiteboard {
    id: number;
    userId: number;
    name: string;
    createdAt: string;
    updatedAt: string;
    _count: {
        images: number;
        texts: number;
        drawings: number;
        shapes: number;
    };
}

export interface IImageNode {
    id: number;
    userId: number;
    whiteboardId: number;
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    zIndex: number;
    opacity: number;
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    grayscale: number;
    sepia: number;
    locked: boolean;
    createdAt: string;
}

export interface ITextNode {
    id: number;
    userId: number;
    whiteboardId: number;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
    fontStyle: string;
    align: string;
    rotation: number;
    zIndex: number;
    locked: boolean;
    createdAt: string;
}

export interface IDrawingNode {
    id: number;
    userId: number;
    whiteboardId: number;
    points: number[];     // flat array: [x1, y1, x2, y2, ...]
    color: string;
    strokeWidth: number;
    opacity: number;
    zIndex: number;
    tension: number;
    locked: boolean;
    createdAt: string;
}

export interface IShapeNode {
    id: number;
    userId: number;
    whiteboardId: number;
    type: 'rect' | 'circle' | 'arrow';
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    zIndex: number;
    locked: boolean;
    createdAt: string;
}

export interface IAuthResponse {
    token: string;
    email: string;
}
