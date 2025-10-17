// src/contexts/UserContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient.js';

// Create the context
const UserContext = createContext();

// Create the provider component
export function UserProvider({ children }) {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This effect runs once to get the initial session and set up the listener
        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);

            // Listen for future auth events (SIGNED_IN, SIGNED_OUT, etc.)
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                (_event, session) => {
                    setSession(session);
                }
            );

            // Return a cleanup function to unsubscribe from the listener
            return () => {
                subscription?.unsubscribe();
            };
        };

        getInitialSession();
    }, []);

    useEffect(() => {
        // This effect runs whenever the session changes (on login or logout)
        const fetchProfile = async () => {
            if (session?.user) {
                const { data: userProfile, error } = await supabase
                    .from('users')
                    .select('*') // You can specify columns like 'role'
                    .eq('id', session.user.id)
                    .single();

                if (error) {
                    console.error('Error fetching user profile:', error);
                }
                setProfile(userProfile);
            } else {
                // If there's no session, the user is logged out, so clear the profile
                setProfile(null);
            }
        };

        fetchProfile();
    }, [session]); // The key is to re-run this effect when the session changes

    const value = {
        session,
        profile,
        isAdmin: profile?.is_admin || false, // This correctly checks your 'is_admin' column
        loading,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

// Custom hook to easily access the context
export function useUser() {
    return useContext(UserContext);
}