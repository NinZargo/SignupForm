// src/contexts/UserContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient.js';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUserProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setUserProfile(profile);
            }
            setLoading(false);
        }
        loadUserProfile();
    }, []);

    const value = {
        profile: userProfile,
        isAdmin: userProfile?.is_admin || false,
        loading,
    };

    return (
        <UserContext.Provider value={value}>
            {!loading && children}
        </UserContext.Provider>
    );
}

// Custom hook to easily access the context
export function useUser() {
    return useContext(UserContext);
}