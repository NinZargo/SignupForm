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

// Start of the current signup week for a session: the most recent occurrence of
// its weekday (0 = Sunday ... 6 = Saturday) at 22:00 that has already passed.
// Must match the cutoff used in the get_session_transport_details SQL function.
export const getSessionWeekCutoff = (dayOfWeek, now = new Date()) => {
    const cutoff = new Date(now);
    cutoff.setHours(22, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - ((now.getDay() - dayOfWeek + 7) % 7));
    if (cutoff > now) cutoff.setDate(cutoff.getDate() - 7);
    return cutoff;
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

            const [activitiesRes, sessionConfigsRes, eventsApprovalRes] = await Promise.all([
                supabase.rpc('get_upcoming_activities'),
                supabase.from('sessions').select('id, is_active, day_of_week'),
                supabase.from('events').select('id, requires_approval')
            ]);

            if (activitiesRes.error) throw activitiesRes.error;

            const activeMap = new Map((sessionConfigsRes.data || []).map(s => [s.id, s.is_active]));
            const approvalMap = new Map((eventsApprovalRes.data || []).map(e => [e.id, e.requires_approval]));

            const fetchedSessions = (activitiesRes.data || [])
                .filter(item => item.type === 'session')
                .map(s => ({
                    ...s,
                    is_active: activeMap.has(s.id) ? activeMap.get(s.id) : true
                }))
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            const fetchedEvents = (activitiesRes.data || [])
                .filter(item => item.type === 'event')
                .map(e => ({
                    ...e,
                    requires_approval: approvalMap.has(e.id) ? approvalMap.get(e.id) : (e.requires_approval ?? false)
                }))
                .sort((a, b) => new Date(a.activity_date) - new Date(b.activity_date));

            setSessions(fetchedSessions);
            setStandardEvents(fetchedEvents);

            if (user) {
                const [signupsRes, sessionSignupsRes] = await Promise.all([
                    supabase.from('signups').select('event_id, status').eq('user_id', user.id),
                    supabase.from('session_signups').select('session_id, status, created_at').eq('user_id', user.id)
                ]);

                const dayMap = new Map((sessionConfigsRes.data || []).map(s => [s.id, s.day_of_week]));
                const statusMap = new Map();

                if (sessionSignupsRes.data) {
                    sessionSignupsRes.data.forEach(s => {
                        const signupDate = new Date(s.created_at);
                        const day = dayMap.get(s.session_id);
                        const cutoff = (day !== undefined && day !== null)
                            ? getSessionWeekCutoff(day)
                            : getCurrentWeekMonday();
                        if (signupDate >= cutoff) {
                            statusMap.set(`session_${s.session_id}`, s.status || 'Waiting List');
                        }
                    });
                }

                if (signupsRes.data) {
                    signupsRes.data.forEach(s => {
                        statusMap.set(`event_${s.event_id}`, s.status || 'Confirmed');
                    });
                }

                setSignedUpStatusMap(statusMap);
            } else {
                setSignedUpStatusMap(new Map());
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
