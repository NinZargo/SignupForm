import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Container, Typography, Card, CardContent, Button, Box, Snackbar, Alert, Divider, Chip, Paper } from "@mui/material";
import { useUser } from '../contexts/UserContext';

function MySignups() {
    const { profile } = useUser();
    const [upcomingSignups, setUpcomingSignups] = useState([]);
    const [pastSignups, setPastSignups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        if (!profile) {
            setLoading(false);
            return;
        };

        async function fetchSignups() {
            const { data, error } = await supabase
                .from("signups")
                .select("id, status, events(*, requires_approval)")
                .eq("user_id", profile.id);

            if (error) {
                console.error("Error fetching signups:", error);
            } else {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const upcoming = [];
                const past = [];

                data.forEach(signup => {
                    if (new Date(signup.events.date) >= today) {
                        upcoming.push(signup);
                    } else {
                        past.push(signup);
                    }
                });

                setUpcomingSignups(upcoming.sort((a, b) => new Date(a.events.date) - new Date(b.events.date)));
                setPastSignups(past.sort((a, b) => new Date(b.events.date) - new Date(a.events.date)));
            }
            setLoading(false);
        }
        fetchSignups();
    }, [profile]);

    async function cancelSignup(signupId) {
        const { error } = await supabase.from("signups").delete().eq("id", signupId);
        if (error) {
            setSnackbar({ open: true, message: 'Failed to cancel signup.', severity: 'error' });
        } else {
            setSnackbar({ open: true, message: 'Signup canceled successfully!', severity: 'success' });
            setUpcomingSignups(prev => prev.filter(s => s.id !== signupId));
            setPastSignups(prev => prev.filter(s => s.id !== signupId));
        }
    }

    const formatDateForGoogle = (dateString) => {
        const date = new Date(dateString);
        date.setUTCHours(9, 0, 0, 0);
        const startTime = date.toISOString().replace(/-|:|\.\d+/g, '');
        date.setUTCHours(date.getUTCHours() + 1);
        const endTime = date.toISOString().replace(/-|:|\.\d+/g, '');
        return `${startTime}/${endTime}`;
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    const getStatusLabel = (status) => {
        if (status === 'Waiting List') return 'On Waitlist';
        return status;
    };

    const getChipStyling = (status) => {
        if (status === 'Confirmed') return { color: 'success' };
        if (status === 'Cancelled') return { color: 'error' };
        return { color: 'default', sx: { backgroundColor: '#757575', color: 'white' } };
    };

    if (loading) return <Typography>Loading your signed-up events...</Typography>;

    const SignupCard = ({ signup, isUpcoming }) => {
        const { events } = signup;
        if (!events) return null;
        const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(events.name)}&dates=${formatDateForGoogle(events.date)}&details=${encodeURIComponent(events.description || '')}&location=${encodeURIComponent(events.location || '')}`;

        return (
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                        <Typography variant="h5">{events.name}</Typography>
                        {events.requires_approval && (
                            <Chip
                                label={getStatusLabel(signup.status)}
                                size="small"
                                {...getChipStyling(signup.status)}
                            />
                        )}
                    </Box>
                    <Typography variant="body2" color="textSecondary">📍 {events.location || 'No location specified'}</Typography>
                    <Typography variant="body2" color="textSecondary">📅 {new Date(events.date).toLocaleDateString()}</Typography>

                    {isUpcoming && (
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                            <Button variant="contained" color="secondary" onClick={() => cancelSignup(signup.id)}>
                                Cancel Signup
                            </Button>
                            <Button variant="outlined" href={googleCalendarUrl} target="_blank" rel="noopener noreferrer">
                                Add to Calendar
                            </Button>
                        </Box>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <Box>
            <Paper
                elevation={4}
                sx={{
                    p: { xs: 2, sm: 3 },
                    mb: 4,
                    borderRadius: 2,
                    textAlign: 'center',
                    background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
                    color: 'white'
                }}
            >
                <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                    My Signups
                </Typography>
                <Typography variant="subtitle1">
                    Here are all the events you've signed up for, past and present.
                </Typography>
            </Paper>

            <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>Upcoming</Typography>
            {upcomingSignups.length > 0 ? (
                upcomingSignups.map(signup => <SignupCard key={signup.id} signup={signup} isUpcoming={true} />)
            ) : (
                <Typography>No upcoming events.</Typography>
            )}

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>Past Events</Typography>
            {pastSignups.length > 0 ? (
                pastSignups.map(signup => <SignupCard key={signup.id} signup={signup} isUpcoming={false} />)
            ) : (
                <Typography>No past events.</Typography>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default MySignups;