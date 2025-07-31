import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
    Typography,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    TextareaAutosize,
    FormControlLabel,
    Switch,
    Paper
} from "@mui/material";
import { Masonry } from "@mui/lab";
import EventCard from "./EventTile.jsx";
import fetchUnsplashImage from "./UnsplashImg";
import { useUser } from '../contexts/UserContext';

function EventList() {
    const { isAdmin } = useUser();
    const [events, setEvents] = useState([]);
    const [signedUpStatusMap, setSignedUpStatusMap] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ name: "", date: "", location: "", image_url: "", description: "", requires_approval: false });

    useEffect(() => {
        async function fetchDashboardData() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            const [eventsResponse, signupsResponse] = await Promise.all([
                supabase.from("events").select("*, requires_approval").order("date", { ascending: true }),
                supabase.from("signups").select("event_id, status").eq("user_id", user.id),
            ]);

            if (eventsResponse.data) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const futureEvents = eventsResponse.data.filter(event => new Date(event.date) >= today);
                setEvents(futureEvents);
            }

            if (signupsResponse.data) {
                const statusMap = new Map(signupsResponse.data.map(signup => [signup.event_id, signup.status]));
                setSignedUpStatusMap(statusMap);
            }
            setLoading(false);
        }
        fetchDashboardData();
    }, []);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewEvent({ ...newEvent, [name]: type === 'checkbox' ? checked : value });
    };
    const handleCreateEvent = async () => {
        if (!newEvent.name) return alert("Event name is required!");
        let imageUrl = newEvent.image_url;
        if (!imageUrl) imageUrl = await fetchUnsplashImage(newEvent.name);

        const eventData = { ...newEvent, image_url: imageUrl || "default-image-url.jpg" };
        const { data, error } = await supabase.from("events").insert([eventData]).select();

        if (error) {
            console.error("Error creating event:", error);
        } else {
            const { data: refreshedEvents } = await supabase.from("events").select("*, requires_approval").order("date", { ascending: true });
            if (refreshedEvents) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const futureEvents = refreshedEvents.filter(event => new Date(event.date) >= today);
                setEvents(futureEvents);
            }
            setNewEvent({ name: "", date: "", location: "", image_url: "", description: "", requires_approval: false });
            handleClose();
        }
    };

    if (loading) return <Typography>Loading events...</Typography>;

    return (
        <Box>
            <Paper
                elevation={4}
                sx={{
                    p: { xs: 2, sm: 4 },
                    mb: 4,
                    borderRadius: 2,
                    textAlign: 'center',
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    color: 'white'
                }}
            >
                <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                    Upcoming Events
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Browse and sign up for our latest sailing adventures.
                </Typography>
                {isAdmin && (
                    <Button variant="contained" color="secondary" onClick={handleOpen}>
                        + New Event
                    </Button>
                )}
            </Paper>

            <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} spacing={2}>
                {events.map((event) => (
                    <EventCard
                        key={event.id}
                        event={event}
                        initialSignupStatus={signedUpStatusMap.get(event.id) || null}
                    />
                ))}
            </Masonry>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogContent>
                    <TextField label="Event Name" name="name" fullWidth onChange={handleChange} sx={{ my: 1 }} />
                    <TextField label="Date" name="date" type="date" fullWidth onChange={handleChange} InputLabelProps={{ shrink: true }} sx={{ my: 1 }} />
                    <TextField label="Location" name="location" fullWidth onChange={handleChange} sx={{ my: 1 }} />
                    <TextField label="Image URL" name="image_url" fullWidth onChange={handleChange} sx={{ my: 1 }} />
                    <TextareaAutosize name="description" minRows={3} placeholder="Enter event description..." style={{ width: "100%", padding: "8px" }} onChange={handleChange} />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={newEvent.requires_approval}
                                onChange={handleChange}
                                name="requires_approval"
                            />
                        }
                        label="Waitlist / Requires Approval"
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleCreateEvent} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default EventList;