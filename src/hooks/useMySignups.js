import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../contexts/UserContext';

export function useMySignups() {
    const { profile } = useUser();
    const [upcomingSignups, setUpcomingSignups] = useState([]);
    const [pastSignups, setPastSignups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMySignups = useCallback(async () => {
        if (!profile?.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data, error: fetchErr } = await supabase.rpc('get_my_signups', { p_user_id: profile.id });

            if (fetchErr) throw fetchErr;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = [];
            const past = [];

            (data || []).forEach(item => {
                const itemDate = new Date(item.item_date);
                if (itemDate >= today) {
                    upcoming.push(item);
                } else {
                    past.push(item);
                }
            });

            setUpcomingSignups(upcoming.sort((a, b) => new Date(a.item_date) - new Date(b.item_date)));
            setPastSignups(past.sort((a, b) => new Date(b.item_date) - new Date(a.item_date)));
        } catch (err) {
            console.error("Failed to fetch signups:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile?.id]);

    useEffect(() => {
        fetchMySignups();
    }, [fetchMySignups]);

    const cancelSignup = async (signupId, itemType) => {
        const tableName = itemType === 'session' ? 'session_signups' : 'signups';
        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', signupId);

        if (error) {
            throw error;
        }
        await fetchMySignups();
    };

    return {
        upcomingSignups,
        pastSignups,
        loading,
        error,
        cancelSignup,
        refetch: fetchMySignups
    };
}
