import { useState } from 'react';
import {
    Card, CardContent, Typography, Button, Box, Dialog, DialogActions, DialogContent,
    DialogTitle, FormControlLabel, Switch, CardMedia, Chip, Paper, Snackbar, Alert
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { supabase } from '../supabaseClient';

export default function SessionHeroCard({ session, isSignedUp, signupStatus, onSignupSuccess }) {
    const [open, setOpen] = useState(false);
    const [canDrive, setCanDrive] = useState(false);
    const [needsTransport, setNeedsTransport] = useState(true);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    const isActive = session.is_active !== false;

    const getButtonText = () => {
        if (!isActive) return 'Not Running This Week';
        if (isSignedUp) {
            if (signupStatus === 'Confirmed' || signupStatus === 'Attending') return 'Spot Confirmed!';
            return 'On Waitlist';
        }
        return 'Request Waitlist Spot';
    };

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleSignup = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setToast({ open: true, message: "You must be logged in to sign up.", severity: 'error' });
            return;
        }

        const { error } = await supabase
            .from('session_signups')
            .insert({
                session_id: session.id,
                user_id: user.id,
                can_drive: canDrive,
                transport_needed: !canDrive ? needsTransport : false,
                status: 'Waiting List'
            });

        if (error) {
            if (error.code === '23505') {
                setToast({ open: true, message: "You've already requested a spot for this session this week.", severity: 'info' });
            } else {
                setToast({ open: true, message: "Error signing up: " + error.message, severity: 'error' });
            }
        } else {
            setToast({ open: true, message: `Successfully added to the waitlist for ${session.name}!`, severity: 'success' });
            onSignupSuccess();
        }
        handleClose();
    };

    return (
        <>
            <Card
                elevation={3}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    borderRadius: 3,
                    overflow: 'hidden',
                    transition: 'transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
                    opacity: isActive ? 1 : 0.75,
                    position: 'relative',
                    '&:hover': isActive ? {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.12)'
                    } : {}
                }}
            >
                <CardMedia
                    component="img"
                    height="190"
                    image={session.image_url || '/BrunelSailingIcon.jpeg'}
                    alt={session.name}
                    sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
                        <Typography variant="h5" fontWeight="bold" component="h2" sx={{ fontSize: '1.25rem', lineHeight: 1.3 }}>
                            {session.name}
                        </Typography>
                        {!isActive ? (
                            <Chip label="Not Running" color="error" size="small" sx={{ fontWeight: 'bold' }} />
                        ) : isSignedUp ? (
                            <Chip
                                icon={signupStatus === 'Confirmed' || signupStatus === 'Attending' ? <CheckCircleOutlineIcon /> : <HourglassEmptyIcon />}
                                label={signupStatus === 'Confirmed' || signupStatus === 'Attending' ? 'Confirmed' : 'On Waitlist'}
                                color={signupStatus === 'Confirmed' || signupStatus === 'Attending' ? 'success' : 'warning'}
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                            />
                        ) : null}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', gap: 0.8, mb: 1.5 }}>
                        <EventIcon fontSize="small" color="primary" />
                        <Typography variant="body2" fontWeight="500">
                            {new Date(session.activity_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {session.description || "Weekly sailboat session at Datchet Water."}
                    </Typography>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                        variant="contained"
                        color={isSignedUp ? (signupStatus === 'Confirmed' ? 'success' : 'warning') : 'primary'}
                        fullWidth
                        size="large"
                        onClick={handleOpen}
                        disabled={!isActive || isSignedUp}
                        sx={{
                            borderRadius: 2,
                            py: 1.2,
                            fontWeight: 'bold',
                            textTransform: 'none',
                            fontSize: '0.95rem',
                            boxShadow: isSignedUp ? 0 : '0 4px 12px rgba(25, 118, 210, 0.3)'
                        }}
                    >
                        {getButtonText()}
                    </Button>
                </Box>
            </Card>

            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
                    Sign Up: {session.name}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.5 }}>
                        Weekly session spots require committee review. Requesting a spot will add you to the waitlist.
                    </Typography>

                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 1.5 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={canDrive}
                                    onChange={(e) => {
                                        setCanDrive(e.target.checked);
                                        if (e.target.checked) setNeedsTransport(false);
                                    }}
                                    color="primary"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <DirectionsCarIcon color="primary" fontSize="small" />
                                    <Typography variant="body2" fontWeight="600">I can drive my own car</Typography>
                                </Box>
                            }
                        />
                    </Paper>

                    {!canDrive && (
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={needsTransport}
                                        onChange={(e) => setNeedsTransport(e.target.checked)}
                                        color="warning"
                                    />
                                }
                                label={
                                    <Typography variant="body2" fontWeight="600">I need transport to Datchet</Typography>
                                }
                            />
                        </Paper>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSignup}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3, fontWeight: 'bold' }}
                    >
                        Request Waitlist Spot
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={() => setToast(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setToast(prev => ({ ...prev, open: false }))}
                    severity={toast.severity}
                    variant="filled"
                    sx={{ width: '100%', borderRadius: 2, fontWeight: 'bold' }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </>
    );
}