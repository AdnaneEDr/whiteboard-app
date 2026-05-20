import { useEffect, useState } from 'react';
import {
    getWhiteboards, createWhiteboard, renameWhiteboard, deleteWhiteboard,
} from '../../services/api';
import type { IWhiteboard } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface Props {
    onOpenWhiteboard: (id: number, name: string) => void;
    onLogout: () => void;
}

const SHORTCUTS = [
    ['Ctrl+Z',            'Annuler (Undo)'],
    ['Ctrl+Y',            'Rétablir (Redo)'],
    ['Ctrl+D',            'Dupliquer l\'élément'],
    ['L',                 'Verrouiller / déverrouiller'],
    ['Suppr / Backspace', 'Supprimer l\'élément'],
    ['Échap',             'Désélectionner'],
    ['?',                 'Afficher / masquer l\'aide'],
    ['Molette souris',    'Zoomer / dézoomer'],
    ['Dbl-clic canvas',   'Ajouter du texte'],
    ['Dbl-clic texte',    'Éditer le texte'],
];

const Dashboard = ({ onOpenWhiteboard, onLogout }: Props) => {
    const { toggleTheme, colors, isDark } = useTheme();
    const [whiteboards,    setWhiteboards]    = useState<IWhiteboard[]>([]);
    const [loading,        setLoading]        = useState(true);
    const [mounted,        setMounted]        = useState(false);
    const [showShortcuts,  setShowShortcuts]  = useState(false);
    const [creatingName,   setCreatingName]   = useState('');
    const [showCreate,     setShowCreate]     = useState(false);
    const [renamingId,     setRenamingId]     = useState<number | null>(null);
    const [renamingValue,  setRenamingValue]  = useState('');
    const [deletingId,     setDeletingId]     = useState<number | null>(null);

    const email    = localStorage.getItem('email') || 'Utilisateur';
    const initials = email.slice(0, 2).toUpperCase();

    const load = () => {
        setLoading(true);
        getWhiteboards()
            .then((res) => {
                setWhiteboards(res.data);
                setLoading(false);
                setTimeout(() => setMounted(true), 50);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        const name = creatingName.trim() || 'Nouveau tableau';
        const res = await createWhiteboard(name);
        setWhiteboards((prev) => [res.data, ...prev]);
        setShowCreate(false);
        setCreatingName('');
    };

    const handleRename = async (id: number) => {
        const name = renamingValue.trim();
        if (!name) { setRenamingId(null); return; }
        const res = await renameWhiteboard(id, name);
        setWhiteboards((prev) => prev.map((w) => w.id === id ? res.data : w));
        setRenamingId(null);
    };

    const handleDelete = async (id: number) => {
        await deleteWhiteboard(id);
        setWhiteboards((prev) => prev.filter((w) => w.id !== id));
        setDeletingId(null);
    };

    const formatDate = (d: string) => {
        const date = new Date(d);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const totalImages = whiteboards.reduce((acc, w) => acc + w._count.images, 0);
    const totalTexts  = whiteboards.reduce((acc, w) => acc + w._count.texts, 0);

    const stats = [
        { label: 'Tableaux',       value: whiteboards.length,      icon: '⬜', bg: 'rgba(79,70,229,0.15)'  },
        { label: 'Images totales', value: totalImages,              icon: '🖼',  bg: 'rgba(124,58,237,0.15)' },
        { label: 'Textes totaux',  value: totalTexts,               icon: '✏️', bg: 'rgba(8,145,178,0.15)'  },
        { label: 'Total éléments', value: totalImages + totalTexts, icon: '📦',  bg: 'rgba(5,150,105,0.15)'  },
    ];

    const fade = (delay = 0): React.CSSProperties => ({
        opacity:   mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateY(16px)',
        transition: `all 0.45s ease ${delay}s`,
    });

    const c = colors;

    return (
        <div style={{
            display: 'flex', minHeight: '100vh',
            fontFamily: "'Inter', system-ui, sans-serif",
            background: c.bg,
            position: 'relative', overflow: 'auto',
            transition: 'background 0.3s',
        }}>
            {/* Radial glow */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: c.glow }} />
            {/* Dot pattern */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                backgroundImage: c.dotPattern, backgroundSize: '28px 28px',
            }} />

            {/* ── Shortcuts modal ── */}
            {showShortcuts && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={() => setShowShortcuts(false)}>
                    <div style={{
                        background: c.bgModal, border: `1px solid ${c.border}`,
                        borderRadius: 20, padding: 32, width: 460,
                        boxShadow: c.shadowLg,
                    }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 20px', color: c.accentText, fontWeight: 800, fontSize: 20 }}>
                            ⌨️ Raccourcis clavier
                        </h2>
                        {SHORTCUTS.map(([k, v]) => (
                            <div key={k} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '8px 0', borderBottom: `1px solid ${c.border}`,
                            }}>
                                <code style={{
                                    background: c.accentBg, border: `1px solid ${c.accentBorder}`,
                                    padding: '2px 10px', borderRadius: 6, fontSize: 12, color: c.accentText,
                                }}>{k}</code>
                                <span style={{ color: c.textSecondary, fontSize: 13 }}>{v}</span>
                            </div>
                        ))}
                        <button onClick={() => setShowShortcuts(false)} style={{
                            marginTop: 20, width: '100%', padding: '11px',
                            background: c.accent, color: 'white', border: 'none',
                            borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14,
                        }}>Fermer</button>
                    </div>
                </div>
            )}

            {/* ── Confirm delete modal ── */}
            {deletingId !== null && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={() => setDeletingId(null)}>
                    <div style={{
                        background: c.bgModal, border: `1px solid ${c.borderDanger}`,
                        borderRadius: 20, padding: 32, width: 380, boxShadow: c.shadowLg,
                    }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 12px', color: '#ef4444', fontWeight: 800, fontSize: 18 }}>
                            🗑 Supprimer le tableau ?
                        </h2>
                        <p style={{ color: c.textSecondary, fontSize: 14, margin: '0 0 24px' }}>
                            Toutes les images et textes de ce tableau seront supprimés définitivement.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setDeletingId(null)} style={{
                                flex: 1, padding: '10px', background: c.bgButton,
                                color: c.textPrimary, border: `1px solid ${c.border}`,
                                borderRadius: 10, cursor: 'pointer', fontWeight: 600,
                            }}>Annuler</button>
                            <button onClick={() => handleDelete(deletingId)} style={{
                                flex: 1, padding: '10px',
                                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                                color: 'white', border: 'none', borderRadius: 10,
                                cursor: 'pointer', fontWeight: 700,
                            }}>Supprimer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Sidebar ── */}
            <aside style={{
                position: 'fixed', left: 0, top: 0, bottom: 0, width: 240, zIndex: 50,
                background: c.bgSidebar,
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                borderRight: `1px solid ${c.border}`,
                display: 'flex', flexDirection: 'column',
                boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
                transition: 'background 0.3s, border-color 0.3s',
            }}>
                {/* Logo */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '24px 20px 20px',
                    borderBottom: `1px solid ${c.border}`,
                }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(79,70,229,0.5)', flexShrink: 0,
                    }}>
                        <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                            <rect x="2"  y="2"  width="11" height="11" rx="3" fill="white" opacity="0.9" />
                            <rect x="15" y="2"  width="11" height="11" rx="3" fill="white" opacity="0.6" />
                            <rect x="2"  y="15" width="11" height="11" rx="3" fill="white" opacity="0.6" />
                            <rect x="15" y="15" width="11" height="11" rx="3" fill="white" opacity="0.3" />
                        </svg>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 17, color: c.textPrimary, letterSpacing: -0.3 }}>
                        Whiteboard
                    </span>
                </div>

                {/* Nav — liste whiteboards */}
                <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.textMuted, letterSpacing: 1, padding: '0 8px', marginBottom: 6, textTransform: 'uppercase' }}>
                        Mes tableaux
                    </div>
                    {whiteboards.map((wb) => (
                        <div
                            key={wb.id}
                            onClick={() => onOpenWhiteboard(wb.id, wb.name)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '9px 10px', borderRadius: 8,
                                fontSize: 13, color: c.textSecondary, cursor: 'pointer',
                                transition: 'background 0.15s, color 0.15s',
                            }}
                            onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: c.accentBg, color: c.textPrimary })}
                            onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: 'transparent', color: c.textSecondary })}
                        >
                            <span style={{ fontSize: 14 }}>⬜</span>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wb.name}</span>
                            <span style={{ fontSize: 11, color: c.textMuted, flexShrink: 0 }}>
                                {wb._count.images + wb._count.texts}
                            </span>
                        </div>
                    ))}
                </nav>

                {/* Footer sidebar */}
                <div style={{
                    borderTop: `1px solid ${c.border}`,
                    padding: '12px 16px',
                    display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
                        style={{
                            width: '100%', padding: '8px 12px',
                            background: c.bgButton, border: `1px solid ${c.border}`,
                            borderRadius: 8, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8,
                            color: c.textSecondary, fontSize: 13, fontWeight: 500,
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: c.bgButtonHover })}
                        onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: c.bgButton })}
                    >
                        <span style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</span>
                        {isDark ? 'Mode clair' : 'Mode sombre'}
                    </button>

                    {/* User + logout */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, color: 'white', fontWeight: 700, flexShrink: 0,
                        }}>{initials}</div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
                        </div>
                        <div
                            onClick={onLogout} title="Déconnexion"
                            style={{
                                width: 30, height: 30, borderRadius: 8,
                                background: c.bgDanger, border: `1px solid ${c.borderDanger}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: 14, color: '#ef4444',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: 'rgba(220,38,38,0.2)' })}
                            onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: c.bgDanger })}
                        >⏻</div>
                    </div>
                </div>
            </aside>

            {/* ── Main ── */}
            <main style={{
                marginLeft: 240, flex: 1, padding: '40px 48px',
                overflowY: 'auto', height: '100vh', boxSizing: 'border-box',
                position: 'relative', zIndex: 1,
            }}>
                {/* Header */}
                <div style={{ ...fade(0), display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, gap: 16 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: c.textPrimary, letterSpacing: -1 }}>
                            Tableau de bord
                        </h1>
                        <p style={{ margin: '6px 0 0', fontSize: 15, color: c.textSecondary }}>
                            Bienvenue, {email.split('@')[0]} 👋
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        style={{
                            padding: '12px 24px',
                            background: c.accent,
                            color: 'white', border: 'none', borderRadius: 12,
                            fontSize: 14, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                            whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, { transform: 'translateY(-2px)', boxShadow: '0 10px 30px rgba(79,70,229,0.55)' })}
                        onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: '0 4px 20px rgba(79,70,229,0.4)' })}
                    >+ Nouveau tableau</button>
                </div>

                {/* Create form */}
                {showCreate && (
                    <div style={{
                        ...fade(0),
                        background: c.accentBg, border: `1px solid ${c.accentBorder}`,
                        borderRadius: 16, padding: '20px 24px', marginBottom: 24,
                        display: 'flex', gap: 12, alignItems: 'center',
                    }}>
                        <input
                            autoFocus
                            value={creatingName}
                            onChange={(e) => setCreatingName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowCreate(false); }}
                            placeholder="Nom du tableau..."
                            style={{
                                flex: 1, background: c.bgInput, border: `1px solid ${c.border}`,
                                borderRadius: 8, padding: '10px 14px',
                                color: c.textPrimary, fontSize: 14, outline: 'none',
                            }}
                        />
                        <button onClick={handleCreate} style={{
                            padding: '10px 20px', background: c.accent,
                            color: 'white', border: 'none', borderRadius: 8,
                            cursor: 'pointer', fontWeight: 700, fontSize: 14,
                        }}>Créer</button>
                        <button onClick={() => setShowCreate(false)} style={{
                            padding: '10px 16px', background: c.bgButton,
                            color: c.textSecondary, border: `1px solid ${c.border}`,
                            borderRadius: 8, cursor: 'pointer', fontSize: 14,
                        }}>Annuler</button>
                    </div>
                )}

                {/* Stats */}
                <div style={{ ...fade(0.1), display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
                    {stats.map((stat) => (
                        <div key={stat.label} style={{
                            background: c.bgCard, backdropFilter: 'blur(12px)',
                            border: `1px solid ${c.border}`, borderRadius: 16, padding: '20px 24px',
                            boxShadow: c.shadow, transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                            onMouseEnter={(e) => Object.assign(e.currentTarget.style, { transform: 'translateY(-3px)', boxShadow: c.shadowLg })}
                            onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: c.shadow })}
                        >
                            <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 12, background: stat.bg }}>{stat.icon}</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: c.textPrimary, letterSpacing: -1, marginBottom: 4 }}>
                                {loading ? '—' : stat.value}
                            </div>
                            <div style={{ fontSize: 13, color: c.textMuted, fontWeight: 500 }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Whiteboard grid */}
                <div style={fade(0.2)}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: c.textPrimary, margin: '0 0 16px', letterSpacing: -0.3 }}>
                        Mes tableaux ({whiteboards.length})
                    </h2>

                    {loading ? (
                        <div style={{ color: c.textMuted, fontSize: 15, padding: '40px 0', textAlign: 'center' }}>Chargement...</div>
                    ) : whiteboards.length === 0 ? (
                        <div style={{
                            background: c.bgCard, border: `2px dashed ${c.border}`,
                            borderRadius: 20, padding: '60px 40px', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>⬜</div>
                            <div style={{ fontSize: 18, fontWeight: 600, color: c.textSecondary, marginBottom: 8 }}>Aucun tableau pour l'instant</div>
                            <div style={{ fontSize: 14, color: c.textMuted }}>Cliquez sur "+ Nouveau tableau" pour commencer</div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 40 }}>
                            {whiteboards.map((wb) => (
                                <div
                                    key={wb.id}
                                    style={{
                                        background: c.bgCard, backdropFilter: 'blur(12px)',
                                        border: `1px solid ${c.border}`, borderRadius: 20, overflow: 'hidden',
                                        boxShadow: c.shadow, transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, { transform: 'translateY(-3px)', boxShadow: c.shadowLg, borderColor: c.borderAccent })}
                                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: c.shadow, borderColor: c.border })}
                                    onClick={() => onOpenWhiteboard(wb.id, wb.name)}
                                >
                                    {/* Preview */}
                                    <div style={{
                                        height: 140,
                                        background: isDark
                                            ? 'linear-gradient(135deg, rgba(79,70,229,0.12) 0%, rgba(124,58,237,0.08) 100%)'
                                            : 'linear-gradient(135deg, rgba(79,70,229,0.07) 0%, rgba(124,58,237,0.04) 100%)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {wb._count.images === 0 && wb._count.texts === 0 ? (
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 32, opacity: 0.3 }}>⬜</div>
                                                <div style={{ fontSize: 12, color: c.textMuted, marginTop: 6 }}>Tableau vide</div>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: 13, color: c.textSecondary, textAlign: 'center' }}>
                                                <div style={{ fontSize: 28, marginBottom: 6 }}>🖼</div>
                                                <div>{wb._count.images} image{wb._count.images !== 1 ? 's' : ''} · {wb._count.texts} texte{wb._count.texts !== 1 ? 's' : ''}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer card */}
                                    <div style={{ padding: '14px 16px' }} onClick={(e) => e.stopPropagation()}>
                                        {renamingId === wb.id ? (
                                            <input
                                                autoFocus
                                                value={renamingValue}
                                                onChange={(e) => setRenamingValue(e.target.value)}
                                                onBlur={() => handleRename(wb.id)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(wb.id); if (e.key === 'Escape') setRenamingId(null); }}
                                                style={{
                                                    width: '100%', background: c.bgInput,
                                                    border: `1px solid ${c.accentBorder}`,
                                                    borderRadius: 6, padding: '6px 10px',
                                                    color: c.textPrimary, fontSize: 14, outline: 'none',
                                                    boxSizing: 'border-box',
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ fontSize: 14, fontWeight: 700, color: c.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                        onClick={() => onOpenWhiteboard(wb.id, wb.name)}>
                                                        {wb.name}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
                                                        Modifié le {formatDate(wb.updatedAt)}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                                    <button title="Renommer"
                                                        onClick={(e) => { e.stopPropagation(); setRenamingId(wb.id); setRenamingValue(wb.name); }}
                                                        style={{ width: 28, height: 28, borderRadius: 6, background: c.bgButton, border: `1px solid ${c.border}`, color: c.textSecondary, cursor: 'pointer', fontSize: 13 }}>✏️</button>
                                                    <button title="Ouvrir"
                                                        onClick={(e) => { e.stopPropagation(); onOpenWhiteboard(wb.id, wb.name); }}
                                                        style={{ width: 28, height: 28, borderRadius: 6, background: c.accentBg, border: `1px solid ${c.accentBorder}`, color: c.accentText, cursor: 'pointer', fontSize: 13 }}>→</button>
                                                    <button title="Supprimer"
                                                        onClick={(e) => { e.stopPropagation(); setDeletingId(wb.id); }}
                                                        style={{ width: 28, height: 28, borderRadius: 6, background: c.bgDanger, border: `1px solid ${c.borderDanger}`, color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>🗑</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick actions */}
                <div style={fade(0.3)}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: c.textPrimary, margin: '0 0 16px', letterSpacing: -0.3 }}>
                        Actions rapides
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        {[
                            { icon: '⬜', label: 'Nouveau tableau',    sub: 'Créer un espace vierge', onClick: () => setShowCreate(true) },
                            { icon: '🖼',  label: 'Ajouter une image', sub: 'PNG, JPEG, WebP',         onClick: async () => {
                                if (whiteboards[0]) { onOpenWhiteboard(whiteboards[0].id, whiteboards[0].name); }
                                else { const res = await createWhiteboard('Nouveau tableau'); onOpenWhiteboard(res.data.id, res.data.name); }
                            }},
                            { icon: '⬇️', label: 'Exporter',           sub: 'PNG ou JPEG',             onClick: async () => {
                                if (whiteboards[0]) { onOpenWhiteboard(whiteboards[0].id, whiteboards[0].name); }
                                else { const res = await createWhiteboard('Nouveau tableau'); onOpenWhiteboard(res.data.id, res.data.name); }
                            }},
                            { icon: '⌨️', label: 'Raccourcis clavier', sub: 'Ctrl+Z, Ctrl+D, L...',   onClick: () => setShowShortcuts(true) },
                        ].map((a) => (
                            <div key={a.label} onClick={a.onClick} style={{
                                background: c.bgCard, backdropFilter: 'blur(12px)',
                                border: `1px solid ${c.border}`, borderRadius: 16, padding: '20px', cursor: 'pointer',
                                transition: 'border-color 0.2s, background 0.2s, transform 0.2s',
                            }}
                                onMouseEnter={(e) => Object.assign(e.currentTarget.style, { borderColor: c.borderAccent, background: c.bgCardHover, transform: 'translateY(-2px)' })}
                                onMouseLeave={(e) => Object.assign(e.currentTarget.style, { borderColor: c.border, background: c.bgCard, transform: 'none' })}
                            >
                                <span style={{ fontSize: 24, marginBottom: 10, display: 'block' }}>{a.icon}</span>
                                <div style={{ fontSize: 14, fontWeight: 600, color: c.textPrimary, marginBottom: 4 }}>{a.label}</div>
                                <div style={{ fontSize: 12, color: c.textMuted }}>{a.sub}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
