import { useState } from "react";
import { supabase } from "../supabaseClient";
import {
    Typography, Box, Button, Dialog, DialogTitle, DialogContent, TextField,
    DialogActions, FormControlLabel, Switch, Divider, Grid, CircularProgress
} from "@mui/material";
import EventCard from "./EventTile.jsx";
import SessionHeroCard from "./SessionHeroCard.jsx";
import HeaderBanner from "./HeaderBanner.jsx";
import ImageDropzone from "./ImageDropzone.jsx";
import fetchUnsplashImage from "./UnsplashImg";
import { useUser } from '../contexts/UserContext';
import { useActivities } from '../hooks/useActivities';
import AddIcon from '@mui/icons-material/Add';

function EventList() {
    const { isAdmin } = useUser();
    const { sessions, standardEvents, signedUpStatusMap, loading, refetch } = useActivities();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [newEvent, setNewEvent] = useState({ name: "", date: "", location: "", description: "", requires_approval: false });

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setSelectedFile(null);
        setOpen(false);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewEvent({ ...newEvent, [name]: type === 'checkbox' ? checked : value });
    };

    const handleCreateEvent = async () => {
        if (!newEvent.name || !newEvent.date) {
            alert("Please fill in the event name and date.");
            return;
        }

        setIsSubmitting(true);
        let finalImagePath = "";

        try {
            // 1. User uploaded a custom file
            if (selectedFile) {
                const ext = selectedFile.name.split('.').pop();
                const fileName = `${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
                const { data: uploadData, error: uploadErr } = await supabase.storage
                    .from('event-images')
                    .upload(fileName, selectedFile, { cacheControl: '3600', upsert: false });

                if (uploadErr) {
                    console.error("Custom image upload error:", uploadErr);
                    alert("Image upload error: " + uploadErr.message);
                } else {
                    finalImagePath = uploadData.path;
                }
            }

            // 2. If no custom file chosen, auto-pick from Unsplash & cache in Supabase bucket!
            if (!finalImagePath) {
                const unsplashResult = await fetchUnsplashImage(newEvent.name);
                const imageUrl = typeof unsplashResult === 'string' ? unsplashResult : unsplashResult?.imageUrl;

                if (imageUrl) {
                    try {
                        console.log("Caching Unsplash image to bucket:", imageUrl);
                        const response = await fetch(imageUrl);
                        const blob = await response.blob();
                        const fileName = `${Date.now()}_unsplash_${newEvent.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpeg`;

                        const { data: uploadData, error: cacheErr } = await supabase.storage
                            .from('event-images')
                            .upload(fileName, blob, { contentType: 'image/jpeg', cacheControl: '3600' });

                        if (!cacheErr && uploadData?.path) {
                            finalImagePath = uploadData.path;
                        } else {
                            finalImagePath = imageUrl; // Fallback to direct URL if storage bucket fails
                        }
                    } catch (fetchErr) {
                        console.error("Failed to download Unsplash image for caching:", fetchErr);
                        finalImagePath = imageUrl;
                    }
                }
            }

            if (!finalImagePath) {
                finalImagePath = 'BrunelSailingIcon.jpeg'; // Default fallback
            }

            // 3. Insert new event with bucket image path
            const { error: insertErr } = await supabase.from("events").insert([
                { ...newEvent, image_url: finalImagePath }
            ]);

            if (insertErr) {
                alert("Error creating event: " + insertErr.message);
            } else {
                await refetch();
                setNewEvent({ name: "", date: "", location: "", description: "", requires_approval: false });
                setSelectedFile(null);
                handleClose();
            }
        } catch (err) {
            console.error("Failed to create event:", err);
            alert("Error: " + err.message);
        } finally {
            setIsSubmitting(false);
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
                        required
                        value={newEvent.name}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="dense"
                        label="Date"
                        name="date"
                        type="date"
                        fullWidth
                        required
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

                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5, fontWeight: 'bold' }}>
                        Event Photo (Optional - leave empty to auto-pick & cache from Unsplash):
                    </Typography>
                    <ImageDropzone onFileAccepted={(file) => setSelectedFile(file)} />

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
                    <Button onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateEvent}
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Event'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default EventList;