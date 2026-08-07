import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
    Typography, Box, Button, Dialog, DialogTitle, DialogContent, TextField,
    DialogActions, FormControlLabel, Switch, Paper, Divider, Grid
} from "@mui/material";
import EventCard from "./EventTile.jsx"; // Your original, working component
import SessionHeroCard from "./SessionHeroCard.jsx"; // The new component for sessions
import fetchUnsplashImage from "./UnsplashImg";
import { useUser } from '../contexts/UserContext';
import AddIcon from '@mui/icons-material/Add';

function EventList() {
    const { isAdmin } = useUser();
    const [sessions, setSessions] = useState([]);
    const [standardEvents, setStandardEvents] = useState([]);
    const [signedUpStatusMap, setSignedUpStatusMap] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ name: "", date: "", location: "", description: "", requires_approval: false });

    // Helper to calculate Monday 00:00:00 of current week
    const getCurrentWeekMonday = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - (day === 0 ? 6 : day - 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    // This new function fetches from our SQL functions
    const fetchActivitiesAndSignups = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Fetch all activities and session config flags in parallel
        const [activitiesRes, sessionConfigsRes] = await Promise.all([
            supabase.rpc('get_upcoming_activities'),
            supabase.from('sessions').select('id, is_active')
        ]);

        if (activitiesRes.error) {
            console.error("Error fetching activities:", activitiesRes.error);
        } else {
            const activeMap = new Map((sessionConfigsRes.data || []).map(s => [s.id, s.is_active]));
            const fetchedSessions = (activitiesRes.data || [])
                .filter(item => item.type === 'session')
                .map(s => ({
                    ...s,
                    is_active: activeMap.has(s.id) ? activeMap.get(s.id) : true
                }))
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            setSessions(fetchedSessions);
            setStandardEvents((activitiesRes.data || []).filter(item => item.type === 'event'));
        }

        // 2. Fetch the user's personal signups to determine their status
        if (user) {
            const { data: signups, error: signupsError } = await supabase.rpc('get_my_signups', { p_user_id: user.id });
            if (signupsError) {
                console.error("Error fetching user signups:", signupsError);
            } else if (signups) {
                const monday = getCurrentWeekMonday();
                const statusMap = new Map();

                signups.forEach(s => {
                    if (s.item_type === 'session') {
                        // A session signup is only valid for the current week's session
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
        setLoading(false);
    };

    useEffect(() => {
        fetchActivitiesAndSignups();
    }, []);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewEvent({ ...newEvent, [name]: type === 'checkbox' ? checked : value });
    };

    const handleCreateEvent = async () => {
        let imageUrl = newEvent.image_url;
        if (!imageUrl) {
            imageUrl = await fetchUnsplashImage(newEvent.name);
        }
        const { error } = await supabase.from("events").insert([{ ...newEvent, image_url: imageUrl }]);
        if (error) {
            console.error("Error creating event:", error);
        } else {
            await fetchActivitiesAndSignups(); // Refresh all data
            setNewEvent({ name: "", date: "", location: "", image_url: "", description: "", requires_approval: false });
            handleClose();
        }
    };

    if (loading) return <Typography>Loading...</Typography>;

    return (
        <Box>
            <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, mb: 4, borderRadius: 2, textAlign: 'center', background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)', color: 'white' }}>
                <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>Events & Sessions</Typography>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Sign up for our weekly sessions and upcoming special events.</Typography>
                {isAdmin && <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={handleOpen}>Create Event</Button>}
            </Paper>

            {/* Weekly Sessions Section */}
            <Typography variant="h5" gutterBottom>Weekly Sessions</Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {sessions.map((session) => (
                    <Grid item key={session.id} xs={12} md={6}>
                        <SessionHeroCard
                            session={session}
                            isSignedUp={signedUpStatusMap.has(`session_${session.id}`)}
                            onSignupSuccess={fetchActivitiesAndSignups}
                        />
                    </Grid>
                ))}
            </Grid>

            <Divider />

            {/* Upcoming Events Section */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Upcoming Events</Typography>
            <Grid container spacing={3}>
                {standardEvents.map((event) => (
                    <Grid item key={event.id} xs={12} sm={6} md={4}>
                        <EventCard
                            event={{ ...event, date: event.activity_date }} // Translate date for your original component
                            initialSignupStatus={signedUpStatusMap.get(`event_${event.id}`) || null}
                            onSignupSuccess={fetchActivitiesAndSignups}
                        />
                    </Grid>
                ))}
            </Grid>

            {/* Create Event Dialog (no changes needed here) */}
            <Dialog open={open} onClose={handleClose}>
                {/* ... your existing Dialog JSX ... */}
            </Dialog>
        </Box>
    );
}

export default EventList;