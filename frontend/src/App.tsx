import { useState, useEffect } from 'react';
import LoginPage from './components/Auth/LoginPage';
import Dashboard from './components/Dashboard/Dashboard';
import Whiteboard from './components/Whiteboard/Whiteboard';
import { useAuth } from './hooks/useAuth';

type View =
    | { screen: 'login' }
    | { screen: 'dashboard' }
    | { screen: 'whiteboard'; id: number; name: string };

const App = () => {
    const { isAuthenticated, handleLogout: authLogout } = useAuth();
    const [view, setView] = useState<View>(
        isAuthenticated() ? { screen: 'dashboard' } : { screen: 'login' }
    );

    // Sync si le token disparaît (ex: expiration)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) setView({ screen: 'login' });
    }, []);

    const handleLogout = () => {
        authLogout();
        setView({ screen: 'login' });
    };

    // Dashboard passe (id, name) — on garde les deux dans le state
    const handleOpenWhiteboard = (id: number, name: string) => {
        setView({ screen: 'whiteboard', id, name });
    };

    if (view.screen === 'login') {
        return <LoginPage onSuccess={() => setView({ screen: 'dashboard' })} />;
    }

    if (view.screen === 'dashboard') {
        return (
            <Dashboard
                onOpenWhiteboard={handleOpenWhiteboard}
                onLogout={handleLogout}
            />
        );
    }

    return (
        <Whiteboard
            whiteboardId={view.id}
            whiteboardName={view.name}
            onLogout={handleLogout}
            onBackToDashboard={() => setView({ screen: 'dashboard' })}
        />
    );
};

export default App;
