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
            setUpcomingSignups([]);
            setPastSignups([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [rpcRes, sessionSignupsRes, eventSignupsRes] = await Promise.all([
                supabase.rpc('get_my_signups', { p_user_id: profile.id }),
                supabase.from('session_signups').select('id, session_id, status').eq('user_id', profile.id),
                supabase.from('signups').select('id, event_id, status').eq('user_id', profile.id)
            ]);

            if (rpcRes.error) throw rpcRes.error;

            const sessionStatusMap = new Map();
            (sessionSignupsRes.data || []).forEach(ss => {
                sessionStatusMap.set(ss.id, ss.status);
                sessionStatusMap.set(`session_${ss.session_id}`, ss.status);
            });

            const eventStatusMap = new Map();
            (eventSignupsRes.data || []).forEach(es => {
                eventStatusMap.set(es.id, es.status);
                eventStatusMap.set(`event_${es.event_id}`, es.status);
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = [];
            const past = [];

            (rpcRes.data || []).forEach(item => {
                let realStatus = item.status;

                if (item.item_type === 'session') {
                    realStatus = sessionStatusMap.get(item.signup_id) || sessionStatusMap.get(`session_${item.item_id}`) || item.status || 'Waiting List';
                } else {
                    realStatus = eventStatusMap.get(item.signup_id) || eventStatusMap.get(`event_${item.item_id}`) || item.status || 'Confirmed';
                }

                const updatedItem = {
                    ...item,
                    status: realStatus
                };

                const itemDate = new Date(item.item_date);
                if (itemDate >= today) {
                    upcoming.push(updatedItem);
                } else {
                    past.push(updatedItem);
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
