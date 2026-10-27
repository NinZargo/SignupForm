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
    Box,
    FormControlLabel,
    Checkbox,
    Chip,
    Snackbar,
    Alert,
    Paper,
    Switch
} from "@mui/material";
import EventIcon from '@mui/icons-material/Event';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { supabase } from "../supabaseClient";
import { useUser } from '../contexts/UserContext';

const SUPABASE_URL = "https://jhhbluhsgqykccyivxei.supabase.co";

function EventTile({ event, initialSignupStatus, onSignupSuccess }) {
    const { profile } = useUser();
    const [open, setOpen] = useState(false);
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

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleSignup = async () => {
        if (!profile) return;
        const isApprovalRequired = event.requires_approval === true || event.requires_approval === 'true';
        const initialStatus = isApprovalRequired ? 'Waiting List' : 'Confirmed';
        const { error } = await supabase.from("signups").insert([{
            user_id: profile.id,
            event_id: event.id,
            can_drive: canDrive,
            transport_needed: needTransport,
            status: initialStatus
        }]);

        if (error) {
            setSnackbarMessage("Failed to sign up: " + error.message);
            setSnackbarOpen(true);
        } else {
            handleClose();
            setSnackbarMessage(isApprovalRequired ? 'Successfully added to waitlist!' : 'Successfully signed up!');
            setSnackbarOpen(true);
            setIsSignedUp(true);
            setSignupStatus(initialStatus);
            if (onSignupSuccess) onSignupSuccess();
        }
    };

    const getStatusChip = () => {
        if (signupStatus === 'Confirmed' || signupStatus === 'Attending') {
            return <Chip icon={<CheckCircleOutlineIcon />} label="Confirmed" color="success" size="small" sx={{ fontWeight: 'bold' }} />;
        }
        if (signupStatus === 'Cancelled') {
            return <Chip label="Cancelled" color="error" size="small" sx={{ fontWeight: 'bold' }} />;
        }
        return <Chip icon={<HourglassEmptyIcon />} label="On Waitlist" color="warning" size="small" sx={{ fontWeight: 'bold' }} />;
    };

    const imageUrl = event.image_url && event.image_url.startsWith('http')
        ? event.image_url
        : `${SUPABASE_URL}/storage/v1/object/public/event-images/${event.image_url}`;

    return (
        <>
            <Card
                elevation={3}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.12)'
                    }
                }}
            >
                {isSignedUp && (
                    <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                        {getStatusChip()}
                    </Box>
                )}
                <CardActionArea onClick={handleOpen} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                    <CardMedia
                        component="img"
                        height="180"
                        image={imageUrl}
                        alt={event.name}
                        sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: '1.2rem', lineHeight: 1.3 }}>
                            {event.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', gap: 0.8, mb: 1 }}>
                            <EventIcon fontSize="small" color="primary" />
                            <Typography variant="body2" fontWeight="500">
                                {new Date(event.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                            {event.description || "No description available."}
                        </Typography>
                    </CardContent>
                </CardActionArea>
            </Card>

            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>{event.name}</DialogTitle>
                <DialogContent>
                    <CardMedia
                        component="img"
                        height="180"
                        image={imageUrl}
                        alt={event.name}
                        sx={{ borderRadius: 2, mb: 2, objectFit: 'cover' }}
                    />
                    <Typography variant="body1" paragraph sx={{ lineHeight: 1.6 }}>
                        {event.description || "No description available."}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', gap: 1, mb: 2 }}>
                        <EventIcon fontSize="small" color="primary" />
                        <Typography variant="body2" fontWeight="bold">
                            {new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </Typography>
                    </Box>

                    {!isSignedUp && (
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 1 }}>
                            {profile?.role === "Driver" ? (
                                <FormControlLabel
                                    control={<Switch checked={canDrive} onChange={(e) => setCanDrive(e.target.checked)} color="primary" />}
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DirectionsCarIcon color="primary" fontSize="small" />
                                            <Typography variant="body2" fontWeight="600">I can drive my own car</Typography>
                                        </Box>
                                    }
                                />
                            ) : (
                                <FormControlLabel
                                    control={<Switch checked={needTransport} onChange={(e) => setNeedTransport(e.target.checked)} color="warning" />}
                                    label={<Typography variant="body2" fontWeight="600">I need transport</Typography>}
                                />
                            )}
                        </Paper>
                    )}

                    {(event.requires_approval === true || event.requires_approval === 'true') && !isSignedUp && (
                        <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 1.5, fontWeight: 'bold' }}>
                            ⚠️ Approval required: Signing up will place you on the waitlist for committee review.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Close</Button>
                    {isSignedUp ? (
                        getStatusChip()
                    ) : (
                        <Button variant="contained" onClick={handleSignup} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold', px: 3 }}>
                            {(event.requires_approval === true || event.requires_approval === 'true') ? 'Request Waitlist Spot' : 'Sign Up'}
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
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" variant="filled" sx={{ width: '100%', borderRadius: 2, fontWeight: 'bold' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
}

export default EventTile;