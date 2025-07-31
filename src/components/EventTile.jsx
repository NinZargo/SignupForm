import { useEffect, useState } from "react";
import {
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    Box,
    FormControlLabel,
    Checkbox,
    Chip,
    Snackbar,
    Alert
} from "@mui/material";
import { supabase } from "../supabaseClient";
import { useUser } from '../contexts/UserContext'; // Using the global context

function EventTile({ event, isInitiallySignedUp }) {
    const { profile, isAdmin } = useUser(); // Get user data from the context

    const [open, setOpen] = useState(false);
    const [signups, setSignups] = useState([]);
    const [isSignedUp, setIsSignedUp] = useState(isInitiallySignedUp);
    const [canDrive, setCanDrive] = useState(false);
    const [needTransport, setNeedTransport] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    // This effect ensures the tile's signup status stays in sync
    useEffect(() => {
        setIsSignedUp(isInitiallySignedUp);
    }, [isInitiallySignedUp]);

    const handleOpen = async () => {
        setOpen(true);
        // fetchSignups is now correctly used here for admins
        if (isAdmin) {
            await fetchSignups();
        }
    };

    const handleClose = () => {
        setSignups([]);
        setOpen(false);
    };

    const fetchSignups = async () => {
        const { data, error } = await supabase
            .from("signups")
            .select(`*, users:users!signups_user_id_fkey(id, name, email)`)
            .eq("event_id", event.id);

        if (error) console.error("Error fetching signups:", error);
        else setSignups(data || []);
    };

    const handleSignup = async () => {
        if (!profile) return; // Use profile from context

        const { error } = await supabase.from("signups").insert([
            {
                user_id: profile.id, // Use profile.id from context
                event_id: event.id,
                can_drive: canDrive,
                transport_needed: needTransport,
                status: "Pending"
            },
        ]);

        if (error) {
            console.error("Error signing up:", error);
            alert("Failed to sign up.");
        } else {
            handleClose();
            setSnackbarOpen(true); // Correctly used to show the Snackbar
            setIsSignedUp(true);
        }
    };

    return (
        <>
            <Card sx={{ mb: 2, position: 'relative' }}>
                {isSignedUp && (
                    <Chip label="Signed Up" color="success" sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }} />
                )}
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
                    {event.image_url && (
                        <CardMedia
                            component="img"
                            height="200"
                            image={event.image_url}
                            alt={event.name}
                            sx={{ borderRadius: 2, marginBottom: 2 }}
                        />
                    )}
                    <Typography variant="body1" gutterBottom>
                        {event.description || "No description available."}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        📅 {new Date(event.date).toLocaleDateString()}
                    </Typography>
                    {isAdmin && signups.length > 0 && (
                        <div>
                            <Typography variant="h6" sx={{ mt: 2 }}>
                                Signups: {signups.length}
                            </Typography>
                            <List>
                                {signups.map((signup) => (
                                    <ListItem key={signup.users?.id || Math.random()}>
                                        <ListItemText primary={signup.users?.name || `Unknown User`} />
                                    </ListItem>
                                ))}
                            </List>
                        </div>
                    )}
                    {!isSignedUp && (
                        profile?.role === "Driver" ? (
                            <Box display="flex" justifyContent="center" mt={2}>
                                <FormControlLabel
                                    control={<Checkbox checked={canDrive} onChange={(e) => setCanDrive(e.target.checked)} />}
                                    label="I can drive"
                                />
                            </Box>
                        ) : (
                            <Box display="flex" justifyContent="center" mt={2}>
                                <FormControlLabel
                                    control={<Checkbox checked={needTransport} onChange={(e) => setNeedTransport(e.target.checked)} />}
                                    label="I need Transport"
                                />
                            </Box>
                        )
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                    {isSignedUp ? (
                        <Typography sx={{ mr: 2, color: 'success.main' }}>You are signed up!</Typography>
                    ) : (
                        <Button variant="contained" onClick={handleSignup}>Sign Up</Button>
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
                    Successfully signed up!
                </Alert>
            </Snackbar>
        </>
    );
}

export default EventTile;