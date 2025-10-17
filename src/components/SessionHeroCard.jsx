import { useState } from 'react';
import { Card, CardContent, Typography, Button, Box, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Switch, CardMedia } from '@mui/material';
import { supabase } from '../supabaseClient';


export default function SessionHeroCard({ session, isSignedUp, onSignupSuccess }) {
    const [open, setOpen] = useState(false);
    const [canDrive, setCanDrive] = useState(false);
    const [needsTransport, setNeedsTransport] = useState(true);

    const isRaceTraining = session.name === 'Race Training';
    const currentDayOfWeek = new Date().getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

    // Disable the button if it's Race Training AND the day is Thursday, Friday, Saturday, or Sunday.
    const isSignupBlocked = isRaceTraining && (currentDayOfWeek > 3 || currentDayOfWeek === 0);

    const getButtonText = () => {
        if (isSignedUp) return 'You are signed up';
        if (isSignupBlocked) return 'Signups Open on Monday';
        return 'Sign Up';
    };

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleSignup = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("You must be logged in to sign up.");
            return;
        }

        const { error } = await supabase
            .from('session_signups')
            .insert({
                session_id: session.id,
                user_id: user.id,
                can_drive: canDrive,
                transport_needed: !canDrive ? needsTransport : false
            });

        if (error) {
            if (error.code === '23505') { // unique_violation
                alert("You've already signed up for this session this week.");
            } else {
                alert("Error signing up: " + error.message);
            }
        } else {
            alert(`Successfully signed up for ${session.name}!`);
            onSignupSuccess(); // Refresh the parent component's data
        }
        handleClose();
    };

    return (
        <>
            <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <CardMedia component="img" height="200" image={session.image_url} alt={session.name} />
                <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2">{session.name}</Typography>
                    <Typography variant="body1" color="text.secondary">
                        Next: {new Date(session.activity_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>{session.description}</Typography>
                </CardContent>
                <Box sx={{ p: 2 }}>
                    <Button variant="contained" fullWidth onClick={handleOpen} disabled={isSignedUp}>
                        {isSignedUp ? 'You are signed up' : 'Sign Up'}
                    </Button>
                </Box>
            </Card>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Sign Up for {session.name}</DialogTitle>
                <DialogContent>
                    <FormControlLabel control={<Switch checked={canDrive} onChange={(e) => setCanDrive(e.target.checked)} />} label="I can drive" />
                    {!canDrive && <FormControlLabel control={<Switch checked={needsTransport} onChange={(e) => setNeedsTransport(e.target.checked)} />} label="I need transport" />}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSignup}>Confirm Signup</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}