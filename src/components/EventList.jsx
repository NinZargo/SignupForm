import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
    Container,
    Typography,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    TextareaAutosize
} from "@mui/material";
import { Masonry } from "@mui/lab";
import EventCard from "./EventTile.jsx";
import fetchUnsplashImage from "./UnsplashImg";

function EventList() {
    const [events, setEvents] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [signedUpEventIds, setSignedUpEventIds] = useState(new Set());
    const [loading, setLoading] = useState(true);

    const [open, setOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ name: "", date: "", location: "", image_url: "", description: "" });

    useEffect(() => {
        async function fetchDashboardData() {
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const [eventsResponse, signupsResponse, userRoleResponse] = await Promise.all([
                supabase.from("events").select("*").order("date", { ascending: true }),
                supabase.from("signups").select("event_id").eq("user_id", user.id),
                supabase.from("users").select("is_admin").eq("id", user.id).single()
            ]);

            if (eventsResponse.error) console.error("Error fetching events:", eventsResponse.error);
            else setEvents(eventsResponse.data || []);

            if (signupsResponse.error) console.error("Error fetching signups:", signupsResponse.error);
            else {
                const eventIdSet = new Set(signupsResponse.data.map(signup => signup.event_id));
                setSignedUpEventIds(eventIdSet);
            }

            if (userRoleResponse.error) console.error("Error fetching user role:", userRoleResponse.error);
            else if (userRoleResponse.data) {
                setUserRole(userRoleResponse.data.is_admin ? "admin" : "user");
            }

            setLoading(false);
        }

        fetchDashboardData();
    }, []);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleChange = (e) => {
        setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
    };

    const handleCreateEvent = async () => {
        if (!newEvent.name) return alert("Event name is required!");

        let imageUrl = newEvent.image_url;
        if (!imageUrl) {
            imageUrl = await fetchUnsplashImage(newEvent.name);
        }

        const eventData = { ...newEvent, image_url: imageUrl || "default-image-url.jpg" };

        const { data, error } = await supabase.from("events").insert([eventData]).select();

        if (error) {
            console.error("Error creating event:", error);
            alert("Failed to create event");
        } else {
            setEvents(prevEvents => [...prevEvents, ...data]);
            setNewEvent({ name: "", date: "", location: "", image_url: "", description: "" });
            handleClose();
        }
    };

    if (loading) return <Typography>Loading events...</Typography>;

    return (
        <Container maxWidth={false} sx={{ width: "90vw", paddingY: 4 }}>
            <Box sx={{ width: "100%", textAlign: "center", marginBottom: 2 }}>
                <Typography variant="h3">Upcoming Events</Typography>
                {userRole === "admin" && (
                    <Button variant="contained" color="primary" onClick={handleOpen} sx={{ marginTop: 2 }}>
                        + New Event
                    </Button>
                )}
            </Box>

            <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} spacing={2}>
                {events.map((event) => (
                    <EventCard
                        key={event.id}
                        event={event}
                        isInitiallySignedUp={signedUpEventIds.has(event.id)}
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
                    <TextareaAutosize
                        name="description"
                        minRows={3}
                        placeholder="Enter event description..."
                        style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", marginTop: '8px' }}
                        onChange={handleChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleCreateEvent} variant="contained">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default EventList;