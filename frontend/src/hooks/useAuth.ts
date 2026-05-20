import { useState } from 'react';
import { login, register } from '../services/api';

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Vérifie si un token existe en localStorage
    const isAuthenticated = () => !!localStorage.getItem('token');

    const handleLogin = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await login(email, password);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('email', res.data.email);
            return true;
        } catch {
            setError('Email ou mot de passe incorrect');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await register(email, password);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('email', res.data.email);
            return true;
        } catch {
            setError('Cet email est déjà utilisé');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
    };

    return { isAuthenticated, handleLogin, handleRegister, handleLogout, loading, error };
};