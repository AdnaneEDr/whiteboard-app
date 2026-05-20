import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

interface Props {
    onSuccess: () => void;
}

const LoginPage = ({ onSuccess }: Props) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { handleLogin, handleRegister, loading, error } = useAuth();
    const { toggleTheme, colors, isDark } = useTheme();
    const c = colors;

    useEffect(() => {
        setTimeout(() => setMounted(true), 50);
    }, []);

    const handleSubmit = async () => {
        const success = isRegister
            ? await handleRegister(email, password)
            : await handleLogin(email, password);
        if (success) onSuccess();
    };

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            minHeight: '100vh', position: 'relative', overflow: 'hidden',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            background: isDark
                ? 'linear-gradient(135deg, #0f0c29 0%, #1a1060 40%, #24243e 100%)'
                : 'linear-gradient(135deg, #e8e8f8 0%, #d4d4f0 40%, #e0e0f0 100%)',
            transition: 'background 0.3s',
        }}>
            {/* Blobs */}
            <div style={{
                position: 'absolute', top: '-20%', left: '-10%',
                width: 500, height: 500, borderRadius: '50%', pointerEvents: 'none',
                background: isDark
                    ? 'radial-gradient(circle, rgba(79,70,229,0.35) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%)',
            }} />
            <div style={{
                position: 'absolute', bottom: '-15%', right: '-5%',
                width: 600, height: 600, borderRadius: '50%', pointerEvents: 'none',
                background: isDark
                    ? 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
            }} />
            <div style={{
                position: 'absolute', top: '40%', left: '60%',
                width: 300, height: 300, borderRadius: '50%', pointerEvents: 'none',
                background: isDark
                    ? 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
            }} />

            {/* Grid overlay */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: isDark
                    ? 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)'
                    : 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
            }} />

            {/* Theme toggle — coin haut droit */}
            <button
                onClick={toggleTheme}
                title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
                style={{
                    position: 'fixed', top: 16, right: 16, zIndex: 100,
                    width: 42, height: 42, borderRadius: 12,
                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    border: `1px solid ${c.border}`,
                    cursor: 'pointer', fontSize: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)', transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)' })}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' })}
            >
                {isDark ? '☀️' : '🌙'}
            </button>

            {/* Card */}
            <div style={{
                position: 'relative', zIndex: 10, width: 400,
                background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${c.border}`,
                borderRadius: 24, padding: '40px 36px',
                boxShadow: isDark
                    ? '0 25px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : '0 25px 60px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease, background 0.3s',
            }}>

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(79,70,229,0.5)',
                    }}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect x="2"  y="2"  width="11" height="11" rx="3" fill="white" opacity="0.9" />
                            <rect x="15" y="2"  width="11" height="11" rx="3" fill="white" opacity="0.6" />
                            <rect x="2"  y="15" width="11" height="11" rx="3" fill="white" opacity="0.6" />
                            <rect x="15" y="15" width="11" height="11" rx="3" fill="white" opacity="0.3" />
                        </svg>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 20, color: c.textPrimary, letterSpacing: -0.5 }}>
                        Whiteboard
                    </span>
                </div>

                <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: c.textPrimary, letterSpacing: -0.5 }}>
                    {isRegister ? 'Créer un compte' : 'Bon retour 👋'}
                </h1>
                <p style={{ margin: '0 0 28px', fontSize: 14, color: c.textSecondary, lineHeight: 1.5 }}>
                    {isRegister ? 'Commencez à créer vos tableaux' : 'Connectez-vous pour accéder à vos tableaux'}
                </p>

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                        color: '#fca5a5', padding: '10px 14px', borderRadius: 10,
                        marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <span>⚠</span> {error}
                    </div>
                )}

                {/* Email */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{
                        display: 'block', fontSize: 12, fontWeight: 600,
                        color: c.textSecondary, marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase',
                    }}>Email</label>
                    <input
                        type="email" placeholder="vous@exemple.com"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 14px',
                            background: c.bgInput, border: `1px solid ${c.border}`,
                            borderRadius: 10, fontSize: 14, color: c.textPrimary,
                            outline: 'none', boxSizing: 'border-box',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                        onFocus={(e) => Object.assign(e.target.style, { borderColor: '#6366f1', boxShadow: '0 0 0 3px rgba(99,102,241,0.2)' })}
                        onBlur={(e) => Object.assign(e.target.style, { borderColor: c.border, boxShadow: 'none' })}
                    />
                </div>

                {/* Password */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{
                        display: 'block', fontSize: 12, fontWeight: 600,
                        color: c.textSecondary, marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase',
                    }}>Mot de passe</label>
                    <input
                        type="password" placeholder="••••••••"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        style={{
                            width: '100%', padding: '12px 14px',
                            background: c.bgInput, border: `1px solid ${c.border}`,
                            borderRadius: 10, fontSize: 14, color: c.textPrimary,
                            outline: 'none', boxSizing: 'border-box',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                        onFocus={(e) => Object.assign(e.target.style, { borderColor: '#6366f1', boxShadow: '0 0 0 3px rgba(99,102,241,0.2)' })}
                        onBlur={(e) => Object.assign(e.target.style, { borderColor: c.border, boxShadow: 'none' })}
                    />
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit} disabled={loading}
                    style={{
                        width: '100%', padding: '13px',
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        color: 'white', border: 'none', borderRadius: 10,
                        fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                        boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        letterSpacing: 0.3, marginTop: 4, opacity: loading ? 0.75 : 1,
                    }}
                    onMouseEnter={(e) => !loading && Object.assign(e.currentTarget.style, { transform: 'translateY(-1px)', boxShadow: '0 8px 28px rgba(79,70,229,0.55)' })}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'translateY(0)', boxShadow: '0 4px 20px rgba(79,70,229,0.4)' })}
                >
                    {loading ? '⏳ Chargement...' : isRegister ? '✨ Créer le compte' : '→ Se connecter'}
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                    <div style={{ flex: 1, height: 1, background: c.border }} />
                    <span style={{ fontSize: 12, color: c.textMuted, flexShrink: 0 }}>ou</span>
                    <div style={{ flex: 1, height: 1, background: c.border }} />
                </div>

                {/* Switch */}
                <p style={{ textAlign: 'center', fontSize: 13, color: c.textSecondary, margin: 0 }}>
                    {isRegister ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
                    <span
                        onClick={() => setIsRegister(!isRegister)}
                        style={{ color: '#818cf8', cursor: 'pointer', fontWeight: 600 }}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, { textDecoration: 'underline' })}
                        onMouseLeave={(e) => Object.assign(e.currentTarget.style, { textDecoration: 'none' })}
                    >
                        {isRegister ? 'Se connecter' : "S'inscrire gratuitement"}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
