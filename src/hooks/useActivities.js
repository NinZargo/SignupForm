import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const getCurrentWeekMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
};

export function useActivities() {
    const [sessions, setSessions] = useState([]);
    const [standardEvents, setStandardEvents] = useState([]);
    const [signedUpStatusMap, setSignedUpStatusMap] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchActivitiesAndSignups = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const [activitiesRes, sessionConfigsRes] = await Promise.all([
                supabase.rpc('get_upcoming_activities'),
                supabase.from('sessions').select('id, is_active')
            ]);

            if (activitiesRes.error) throw activitiesRes.error;

            const activeMap = new Map((sessionConfigsRes.data || []).map(s => [s.id, s.is_active]));

            const fetchedSessions = (activitiesRes.data || [])
                .filter(item => item.type === 'session')
                .map(s => ({
                    ...s,
                    is_active: activeMap.has(s.id) ? activeMap.get(s.id) : true
                }))
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            const fetchedEvents = (activitiesRes.data || [])
                .filter(item => item.type === 'event')
                .sort((a, b) => new Date(a.activity_date) - new Date(b.activity_date));

            setSessions(fetchedSessions);
            setStandardEvents(fetchedEvents);

            if (user) {
                const { data: signups, error: signupsError } = await supabase.rpc('get_my_signups', { p_user_id: user.id });
                if (signupsError) {
                    console.error("Error fetching user signups:", signupsError);
                } else if (signups) {
                    const monday = getCurrentWeekMonday();
                    const statusMap = new Map();

                    signups.forEach(s => {
                        if (s.item_type === 'session') {
                            const signupDate = new Date(s.created_at || s.item_date);
                            if (signupDate >= monday) {
                                statusMap.set(`session_${s.item_id}`, s.status || 'Confirmed');
                            }
                        } else {
                            statusMap.set(`event_${s.item_id}`, s.status || 'Confirmed');
                        }
                    });
                    setSignedUpStatusMap(statusMap);
                }
            }
        } catch (err) {
            console.error("Failed to load activities:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActivitiesAndSignups();
    }, [fetchActivitiesAndSignups]);

    return {
        sessions,
        standardEvents,
        signedUpStatusMap,
        loading,
        error,
        refetch: fetchActivitiesAndSignups
    };
}
