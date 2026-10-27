// src/contexts/UserContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient.js';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [session,      setSession]      = useState(null);
    const [profile,      setProfile]      = useState(null);
    const [loading,      setLoading]      = useState(true);
    const [recoveryMode, setRecoveryMode] = useState(false);

    useEffect(() => {
        // Fetch initial session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                supabase.from('users').select('*').eq('id', session.user.id).single()
                    .then(({ data }) => setProfile(data));
            }
            setLoading(false);
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // Supabase SDK has parsed the tokens from the URL hash and
                // established a recovery session. Flag it — AppRoutes will
                // navigate to /update-password after it mounts.
                setSession(session);
                setRecoveryMode(true);
                setLoading(false);
                return;
            }

            setSession(session);

            if (event === 'SIGNED_OUT' || !session) {
                setSession(null);
                setProfile(null);
                setRecoveryMode(false);
            } else if (session?.user) {
                supabase.from('users').select('*').eq('id', session.user.id).single()
                    .then(({ data }) => setProfile(data));
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const refreshProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
            if (data) setProfile(data);
        }
    };

    const logout = async () => {
        try { await supabase.auth.signOut(); } catch (err) { console.error('Signout error:', err); }
        setSession(null);
        setProfile(null);
        setRecoveryMode(false);
        const savedTheme = localStorage.getItem('themeMode');
        localStorage.clear();
        sessionStorage.clear();
        if (savedTheme) localStorage.setItem('themeMode', savedTheme);
    };

    return (
        <UserContext.Provider value={{
            session, profile, loading,
            isAdmin: profile?.is_admin || false,
            recoveryMode, setRecoveryMode,
            logout, refreshProfile,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}