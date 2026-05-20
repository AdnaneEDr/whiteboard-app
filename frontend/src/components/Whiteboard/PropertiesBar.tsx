import type { IImageNode, ITextNode, IDrawingNode, IShapeNode } from '../../types';

interface ImageProps   { type: 'image';   node: IImageNode;   onChange: (u: Partial<IImageNode>)   => void; }
interface TextProps    { type: 'text';    node: ITextNode;    onChange: (u: Partial<ITextNode>)    => void; }
interface DrawingProps { type: 'drawing'; node: IDrawingNode; onChange: (u: Partial<IDrawingNode>) => void; }
interface ShapeProps   { type: 'shape';   node: IShapeNode;   onChange: (u: Partial<IShapeNode>)   => void; }
type Props = ImageProps | TextProps | DrawingProps | ShapeProps;

const FONT_FAMILIES = [
    'sans-serif', 'serif', 'monospace',
    'Georgia', 'Verdana', 'Trebuchet MS',
    'Arial Black', 'Impact', 'Courier New',
];

const PRESET_COLORS = [
    '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
];

const PropertiesBar = (props: Props) => {
    const panelStyle: React.CSSProperties = {
        position: 'fixed',
        top: 72,
        right: 16,
        width: 264,
        background: 'rgba(15, 12, 41, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 16,
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '16px 18px',
        zIndex: 150,
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
    };

    const label: React.CSSProperties = {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
    };

    const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };

    const sliderRow = (
        lbl: string, value: number, min: number, max: number, step: number,
        onChange: (v: number) => void,
    ) => (
        <div key={lbl}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <span style={label}>{lbl}</span>
                <span style={{
                    marginLeft: 'auto', color: 'rgba(255,255,255,0.8)', fontWeight: 600,
                    fontSize: 11, fontVariantNumeric: 'tabular-nums',
                    background: 'rgba(255,255,255,0.08)', padding: '1px 7px', borderRadius: 4,
                }}>
                    {Math.round(value * 100) / 100}
                </span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#818cf8', cursor: 'pointer' }} />
        </div>
    );

    const sectionTitle = (t: string, icon: string) => (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700,
            color: '#818cf8', textTransform: 'uppercase', letterSpacing: 1,
            paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
            <span style={{
                width: 24, height: 24, background: 'rgba(99,102,241,0.2)', borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
            }}>{icon}</span>
            {t}
        </div>
    );

    const inputNum: React.CSSProperties = {
        width: 70, padding: '5px 8px', background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
        fontSize: 12, color: 'rgba(255,255,255,0.9)', outline: 'none',
    };

    const selectStyle: React.CSSProperties = {
        width: '100%', padding: '7px 10px', background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
        fontSize: 12, color: 'rgba(255,255,255,0.9)', cursor: 'pointer', outline: 'none',
    };

    const resetBtn = (onClick: () => void) => (
        <button onClick={onClick} style={{
            width: '100%', padding: '8px 0', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.05)', cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s',
        }}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' })}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' })}
        >↺ Réinitialiser</button>
    );

    // ── Color palette helper ──────────────────────────────────────────
    const colorPalette = (currentColor: string, onPick: (c: string) => void) => (
        <div>
            <div style={label}>Couleur</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {PRESET_COLORS.map((c) => (
                    <div key={c} onClick={() => onPick(c)} style={{
                        width: 20, height: 20, borderRadius: 4, background: c,
                        border: currentColor === c ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer', flexShrink: 0,
                    }} />
                ))}
            </div>
            <input type="color" value={currentColor} onChange={(e) => onPick(e.target.value)}
                style={{ width: '100%', height: 30, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.07)', padding: 2 }} />
        </div>
    );

    // ── IMAGE ─────────────────────────────────────────────────────────
    if (props.type === 'image') {
        const { node, onChange } = props;
        return (
            <div style={panelStyle}>
                {sectionTitle('Image', '🖼')}
                <div>
                    <div style={label}>Dimensions</div>
                    <div style={row}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600 }}>W</span>
                        <input type="number" value={Math.round(node.width)}
                            onChange={(e) => onChange({ width: Math.max(20, parseInt(e.target.value) || 20) })}
                            style={inputNum} />
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600 }}>H</span>
                        <input type="number" value={Math.round(node.height)}
                            onChange={(e) => onChange({ height: Math.max(20, parseInt(e.target.value) || 20) })}
                            style={inputNum} />
                    </div>
                </div>
                {sliderRow('Opacité', node.opacity ?? 1, 0, 1, 0.01, (v) => onChange({ opacity: v }))}
                {sectionTitle('Filtres', '🎨')}
                {sliderRow('Luminosité', node.brightness ?? 1, 0.2, 3, 0.05, (v) => onChange({ brightness: v }))}
                {sliderRow('Contraste',  node.contrast  ?? 1, 0.2, 3, 0.05, (v) => onChange({ contrast: v }))}
                {sliderRow('Saturation', node.saturation ?? 1, 0, 3, 0.05, (v) => onChange({ saturation: v }))}
                {sliderRow('Flou',       node.blur       ?? 0, 0, 20, 0.5, (v) => onChange({ blur: v }))}
                {sliderRow('Noir & Blanc', node.grayscale ?? 0, 0, 1, 0.05, (v) => onChange({ grayscale: v }))}
                {sliderRow('Sépia',      node.sepia      ?? 0, 0, 1, 0.05, (v) => onChange({ sepia: v }))}
                {resetBtn(() => onChange({ brightness: 1, contrast: 1, saturation: 1, blur: 0, grayscale: 0, sepia: 0, opacity: 1 }))}
            </div>
        );
    }

    // ── TEXT ──────────────────────────────────────────────────────────
    if (props.type === 'text') {
        const { node, onChange } = props;
        const isBold   = (node.fontStyle || '').includes('bold');
        const isItalic = (node.fontStyle || '').includes('italic');

        const toggleStyle = (style: 'bold' | 'italic') => {
            let b = isBold; let i = isItalic;
            if (style === 'bold') b = !b;
            if (style === 'italic') i = !i;
            onChange({ fontStyle: [b ? 'bold' : '', i ? 'italic' : ''].filter(Boolean).join(' ') || 'normal' });
        };

        const styleBtn = (active: boolean): React.CSSProperties => ({
            padding: '5px 14px', border: `1px solid ${active ? '#6366f1' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 8, fontSize: 14, color: active ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
            background: active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
            cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s',
        });

        return (
            <div style={panelStyle}>
                {sectionTitle('Texte', '✏️')}
                <div>
                    <div style={label}>Police</div>
                    <select value={node.fontFamily || 'sans-serif'} onChange={(e) => onChange({ fontFamily: e.target.value })} style={selectStyle}>
                        {FONT_FAMILIES.map((f) => <option key={f} value={f} style={{ fontFamily: f, background: '#1a1060' }}>{f}</option>)}
                    </select>
                </div>
                <div style={row}>
                    <div style={{ flex: 1 }}>
                        <div style={label}>Taille</div>
                        <input type="number" value={node.fontSize}
                            onChange={(e) => onChange({ fontSize: Math.max(8, parseInt(e.target.value) || 8) })}
                            style={{ ...inputNum, width: '100%' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={label}>Couleur</div>
                        <input type="color" value={node.color} onChange={(e) => onChange({ color: e.target.value })}
                            style={{ width: '100%', height: 34, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.07)', padding: 2 }} />
                    </div>
                </div>
                <div>
                    <div style={label}>Style</div>
                    <div style={row}>
                        <button onClick={() => toggleStyle('bold')}   style={styleBtn(isBold)}><b>B</b></button>
                        <button onClick={() => toggleStyle('italic')} style={styleBtn(isItalic)}><i>I</i></button>
                    </div>
                </div>
                <div>
                    <div style={label}>Alignement</div>
                    <div style={row}>
                        {(['left', 'center', 'right'] as const).map((a) => (
                            <button key={a} onClick={() => onChange({ align: a })} style={styleBtn(node.align === a)} title={a}>
                                {a === 'left' ? '⬅' : a === 'center' ? '↔' : '➡'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── DRAWING ───────────────────────────────────────────────────────
    if (props.type === 'drawing') {
        const { node, onChange } = props;
        return (
            <div style={panelStyle}>
                {sectionTitle('Tracé', '✏️')}
                {colorPalette(node.color, (c) => onChange({ color: c }))}
                {sliderRow('Épaisseur', node.strokeWidth, 1, 40, 1, (v) => onChange({ strokeWidth: v }))}
                {sliderRow('Opacité',   node.opacity,     0, 1,  0.01, (v) => onChange({ opacity: v }))}
                {sliderRow('Tension (lissage)', node.tension ?? 0.5, 0, 1, 0.05, (v) => onChange({ tension: v }))}
            </div>
        );
    }

    // ── SHAPE ─────────────────────────────────────────────────────────
    const { node, onChange } = props;
    return (
        <div style={panelStyle}>
            {sectionTitle(
                node.type === 'rect' ? 'Rectangle' : node.type === 'circle' ? 'Ellipse' : 'Flèche',
                node.type === 'rect' ? '▭' : node.type === 'circle' ? '◯' : '➡',
            )}

            {/* Dimensions */}
            <div>
                <div style={label}>Dimensions</div>
                <div style={row}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600 }}>W</span>
                    <input type="number" value={Math.round(node.width)}
                        onChange={(e) => onChange({ width: Math.max(10, parseInt(e.target.value) || 10) })} style={inputNum} />
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600 }}>H</span>
                    <input type="number" value={Math.round(node.height)}
                        onChange={(e) => onChange({ height: Math.max(10, parseInt(e.target.value) || 10) })} style={inputNum} />
                </div>
            </div>

            {/* Stroke color */}
            {colorPalette(node.stroke, (c) => onChange({ stroke: c }))}

            {/* Fill color */}
            <div>
                <div style={label}>Remplissage</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <button onClick={() => onChange({ fill: 'transparent' })} style={{
                        flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600,
                        border: node.fill === 'transparent' ? '1.5px solid #6366f1' : '1px solid rgba(255,255,255,0.12)',
                        background: node.fill === 'transparent' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                        color: node.fill === 'transparent' ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                    }}>Vide</button>
                    <input type="color" value={node.fill === 'transparent' ? '#3b82f6' : node.fill}
                        onChange={(e) => onChange({ fill: e.target.value })}
                        title="Couleur de remplissage"
                        style={{ flex: 1, height: 30, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.07)', padding: 2 }} />
                </div>
            </div>

            {sliderRow('Épaisseur bordure', node.strokeWidth, 0.5, 20, 0.5, (v) => onChange({ strokeWidth: v }))}
            {sliderRow('Opacité', node.opacity, 0, 1, 0.01, (v) => onChange({ opacity: v }))}
        </div>
    );
};

export default PropertiesBar;
