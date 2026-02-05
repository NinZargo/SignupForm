import { useEffect, useState } from "react";
import {
    Card, CardActionArea, CardContent, CardMedia, Typography, Dialog, DialogTitle,
    DialogContent, DialogActions, Button, List, ListItem, ListItemText, Box,
    FormControlLabel, Checkbox, Chip, Snackbar, Alert
} from "@mui/material";
import { supabase } from "../supabaseClient";
import { useUser } from '../contexts/UserContext';

function EventTile({ event, initialSignupStatus }) {
    const { profile, isAdmin } = useUser();
    const [open, setOpen] = useState(false);
    const [signupCount, setSignupCount] = useState(0);
    const [signups, setSignups] = useState([]);
    const [isSignedUp, setIsSignedUp] = useState(!!initialSignupStatus);
    const [signupStatus, setSignupStatus] = useState(initialSignupStatus);
    const [canDrive, setCanDrive] = useState(false);
    const [needTransport, setNeedTransport] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    useEffect(() => {
        setIsSignedUp(!!initialSignupStatus);
        setSignupStatus(initialSignupStatus);
    }, [initialSignupStatus]);

    const handleOpen = async () => {
        setOpen(true);
        if (isAdmin) {
            await fetchSignups();
        }
    };

    const handleClose = () => {
        setSignups([]);
        setOpen(false);
    };

    const fetchSignups = async () => {
        const { count, error } = await supabase
            .from("signups")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id);
        if (error) console.error("Error fetching signups:", error);
        else setSignupCount(count || 0);
    };

    const handleSignup = async () => {
        if (!profile) return;

        const initialStatus = event.requires_approval ? 'Waiting List' : 'Confirmed';

        const { error } = await supabase.from("signups").insert([
            {
                user_id: profile.id,
                event_id: event.id,
                can_drive: canDrive,
                transport_needed: needTransport,
                status: initialStatus
            },
        ]);

        if (error) {
            console.error("Error signing up:", error);
            alert("Failed to sign up.");
        } else {
            handleClose();
            setSnackbarMessage(event.requires_approval ? 'Successfully added to waitlist!' : 'Successfully signed up!');
            setSnackbarOpen(true);
            setIsSignedUp(true);
            setSignupStatus(initialStatus);
        }
    };

    const getStatusLabel = () => {
        if (signupStatus === 'Waiting List') return 'On Waitlist';
        return signupStatus; // 'Confirmed' or 'Cancelled'
    };

    const getChipStyling = (status) => {
        if (status === 'Confirmed') return { color: 'success' };
        if (status === 'Cancelled') return { color: 'error' };
        return { color: 'default', sx: { backgroundColor: '#757575', color: 'white' } };
    };

    return (
        <>
            <Card sx={{ mb: 2, position: 'relative' }}>
                {/* --- FIX IS HERE --- */}
                {/* This now correctly shows a chip for ANY event the user is signed up for. */}
                {isSignedUp && (
                    event.requires_approval ? (
                        // For waitlist events, show the detailed status chip
                        <Chip
                            label={getStatusLabel()}
                            {...getChipStyling(signupStatus)}
                            sx={{ ...getChipStyling(signupStatus).sx, position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                        />
                    ) : (
                        // For regular events, show a simple "Signed Up" chip
                        <Chip
                            label="Signed Up"
                            color="success"
                            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                        />
                    )
                )}
                {/* --- END OF FIX --- */}
                <CardActionArea onClick={handleOpen}>
                    <CardMedia
                        component="img"
                        height="140"
                        image={event.image_url || "/default-event.jpg"}
                        alt={event.name}
                    />
                    <CardContent>
                        <Typography variant="h5">{event.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                            📅 {new Date(event.date).toLocaleDateString()}
                        </Typography>
                    </CardContent>
                </CardActionArea>
            </Card>

            <Dialog
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: { zIndex: (theme) => theme.zIndex.modal + 1 }
                }}
            >
                <DialogTitle>{event.name}</DialogTitle>
                <DialogContent>
                    {event.image_url && ( <CardMedia component="img" height="200" image={event.image_url} alt={event.name} sx={{ borderRadius: 2, marginBottom: 2 }} /> )}
                    <Typography variant="body1" gutterBottom>{event.description || "No description available."}</Typography>
                    <Typography variant="body2" color="textSecondary">📅 {new Date(event.date).toLocaleDateString()}</Typography>

                    {isAdmin && signupCount > 0 && (
                        <div>
                            <Typography variant="h6" sx={{ mt: 2 }}>Signups: {signupCount}</Typography>
                        </div>
                    )}
                    {!isSignedUp && (
                        profile?.role === "Driver" ? (
                            <Box display="flex" justifyContent="center" mt={2}>
                                <FormControlLabel control={<Checkbox checked={canDrive} onChange={(e) => setCanDrive(e.target.checked)} />} label="I can drive" />
                            </Box>
                        ) : (
                            <Box display="flex" justifyContent="center" mt={2}>
                                <FormControlLabel control={<Checkbox checked={needTransport} onChange={(e) => setNeedTransport(e.target.checked)} />} label="I need Transport" />
                            </Box>
                        )
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                    {isSignedUp ? (
                        event.requires_approval ? (
                            <Chip
                                label={getStatusLabel()}
                                {...getChipStyling(signupStatus)}
                                sx={{ ...getChipStyling(signupStatus).sx, mr: 2 }}
                            />
                        ) : (
                            <Typography sx={{ mr: 2, color: 'success.main' }}>You are signed up!</Typography>
                        )
                    ) : (
                        <Button variant="contained" onClick={handleSignup}>
                            {event.requires_approval ? 'Request to Go' : 'Sign Up'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
}

export default EventTile;