import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeColors {
    // Backgrounds
    bg: string;
    bgSecondary: string;
    bgCard: string;
    bgCardHover: string;
    bgSidebar: string;
    bgInput: string;
    bgModal: string;
    bgButton: string;
    bgButtonHover: string;
    bgDanger: string;

    // Borders
    border: string;
    borderAccent: string;
    borderDanger: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;

    // Accents
    accent: string;
    accentBg: string;
    accentBorder: string;
    accentText: string;

    // Decorative
    glow: string;
    dotPattern: string;
    shadow: string;
    shadowLg: string;

    // Canvas
    canvasBg: string;
}

export const darkTheme: ThemeColors = {
    bg:             '#0f0c29',
    bgSecondary:    '#13103a',
    bgCard:         'rgba(255,255,255,0.04)',
    bgCardHover:    'rgba(99,102,241,0.08)',
    bgSidebar:      'rgba(10,8,30,0.92)',
    bgInput:        'rgba(255,255,255,0.07)',
    bgModal:        'rgba(15,12,41,0.97)',
    bgButton:       'rgba(255,255,255,0.07)',
    bgButtonHover:  'rgba(255,255,255,0.12)',
    bgDanger:       'rgba(220,38,38,0.1)',

    border:         'rgba(255,255,255,0.08)',
    borderAccent:   'rgba(99,102,241,0.4)',
    borderDanger:   'rgba(220,38,38,0.25)',

    textPrimary:    '#ffffff',
    textSecondary:  'rgba(255,255,255,0.65)',
    textMuted:      'rgba(255,255,255,0.3)',

    accent:         'linear-gradient(135deg, #4f46e5, #7c3aed)',
    accentBg:       'rgba(99,102,241,0.15)',
    accentBorder:   'rgba(99,102,241,0.35)',
    accentText:     '#a5b4fc',

    glow:           'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(79,70,229,0.18) 0%, transparent 70%)',
    dotPattern:     'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
    shadow:         '0 4px 20px rgba(0,0,0,0.25)',
    shadowLg:       '0 30px 80px rgba(0,0,0,0.6)',

    canvasBg:       '#1a1730',
};

export const lightTheme: ThemeColors = {
    bg:             '#f4f4f8',
    bgSecondary:    '#eeeef5',
    bgCard:         'rgba(255,255,255,0.85)',
    bgCardHover:    'rgba(99,102,241,0.06)',
    bgSidebar:      'rgba(255,255,255,0.95)',
    bgInput:        'rgba(0,0,0,0.05)',
    bgModal:        'rgba(255,255,255,0.98)',
    bgButton:       'rgba(0,0,0,0.06)',
    bgButtonHover:  'rgba(0,0,0,0.1)',
    bgDanger:       'rgba(220,38,38,0.08)',

    border:         'rgba(0,0,0,0.08)',
    borderAccent:   'rgba(99,102,241,0.35)',
    borderDanger:   'rgba(220,38,38,0.2)',

    textPrimary:    '#18181b',
    textSecondary:  'rgba(0,0,0,0.6)',
    textMuted:      'rgba(0,0,0,0.35)',

    accent:         'linear-gradient(135deg, #4f46e5, #7c3aed)',
    accentBg:       'rgba(99,102,241,0.1)',
    accentBorder:   'rgba(99,102,241,0.3)',
    accentText:     '#4f46e5',

    glow:           'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(79,70,229,0.1) 0%, transparent 70%)',
    dotPattern:     'radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)',
    shadow:         '0 4px 20px rgba(0,0,0,0.08)',
    shadowLg:       '0 30px 80px rgba(0,0,0,0.15)',

    canvasBg:       '#e8e8f0',
};

export const useTheme = () => {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme') as Theme | null;
        return saved ?? 'light';
    });

    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

    const colors = theme === 'dark' ? darkTheme : lightTheme;

    return { theme, toggleTheme, colors, isDark: theme === 'dark' };
};
