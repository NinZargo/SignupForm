import { useState } from "react";
import { supabase } from "../supabaseClient";
import {
    Typography, Box, Button, Dialog, DialogTitle, DialogContent, TextField,
    DialogActions, FormControlLabel, Switch, Divider, Grid
} from "@mui/material";
import EventCard from "./EventTile.jsx";
import SessionHeroCard from "./SessionHeroCard.jsx";
import HeaderBanner from "./HeaderBanner.jsx";
import fetchUnsplashImage from "./UnsplashImg";
import { useUser } from '../contexts/UserContext';
import { useActivities } from '../hooks/useActivities';
import AddIcon from '@mui/icons-material/Add';

function EventList() {
    const { isAdmin } = useUser();
    const { sessions, standardEvents, signedUpStatusMap, loading, refetch } = useActivities();
    const [open, setOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ name: "", date: "", location: "", description: "", requires_approval: false });

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
            await refetch();
            setNewEvent({ name: "", date: "", location: "", image_url: "", description: "", requires_approval: false });
            handleClose();
        }
    };

    if (loading) return <Typography sx={{ p: 4 }}>Loading activities...</Typography>;

    return (
        <Box>
            <HeaderBanner
                title="Events & Sessions"
                subtitle="Sign up for our weekly sessions and upcoming special events."
                bgGradient="linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)"
                actionButton={
                    isAdmin ? (
                        <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={handleOpen}>
                            Create Event
                        </Button>
                    ) : null
                }
            />

            {/* Weekly Sessions Section */}
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                Weekly Sessions
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {sessions.map((session) => (
                    <Grid item key={session.id} xs={12} md={6}>
                        <SessionHeroCard
                            session={session}
                            isSignedUp={signedUpStatusMap.has(`session_${session.id}`)}
                            onSignupSuccess={refetch}
                        />
                    </Grid>
                ))}
            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* Upcoming Events Section */}
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                Upcoming Events
            </Typography>
            <Grid container spacing={3}>
                {standardEvents.map((event) => (
                    <Grid item key={event.id} xs={12} sm={6} md={4}>
                        <EventCard
                            event={{ ...event, date: event.activity_date }}
                            initialSignupStatus={signedUpStatusMap.get(`event_${event.id}`) || null}
                            onSignupSuccess={refetch}
                        />
                    </Grid>
                ))}
            </Grid>

            {/* Create Event Dialog */}
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>Create New Event</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        label="Event Name"
                        name="name"
                        fullWidth
                        value={newEvent.name}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="dense"
                        label="Date"
                        name="date"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={newEvent.date}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="dense"
                        label="Location"
                        name="location"
                        fullWidth
                        value={newEvent.location}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        name="description"
                        multiline
                        rows={3}
                        fullWidth
                        value={newEvent.description}
                        onChange={handleChange}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={newEvent.requires_approval}
                                onChange={handleChange}
                                name="requires_approval"
                            />
                        }
                        label="Requires Approval (Waitlist)"
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateEvent}>Create</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default EventList;