// src/pages/MySignups.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../contexts/UserContext';
import {
    Box, Typography, List, ListItem, ListItemText, Chip, Paper, Divider, IconButton, Tooltip,
    Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function MySignupsPage() {
    const { profile } = useUser();
    const [upcomingSignups, setUpcomingSignups] = useState([]);
    const [pastSignups, setPastSignups] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMySignups = async () => {
        if (!profile) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase.rpc('get_my_signups', { p_user_id: profile.id });

        if (error) {
            console.error("Failed to fetch signups:", error);
        } else if (data) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = [];
            const past = [];

            data.forEach(item => {
                const itemDate = new Date(item.item_date);
                if (itemDate >= today) {
                    upcoming.push(item);
                } else {
                    past.push(item);
                }
            });

            setUpcomingSignups(upcoming.sort((a, b) => new Date(a.item_date) - new Date(b.item_date)));
            setPastSignups(past.sort((a, b) => new Date(b.item_date) - new Date(a.item_date)));
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMySignups();
    }, [profile]);

    const handleCancelSignup = async (signupId, itemType) => {
        const tableName = itemType === 'session' ? 'session_signups' : 'signups';

        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', signupId);

        if (error) {
            alert(`Failed to cancel signup: ${error.message}`);
        } else {
            alert("Your signup has been cancelled.");
            await fetchMySignups();
        }
    };

    const renderSignupList = (items, isUpcoming = true) => (
        <List component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
            {items.map((signup, index) => (
                <div key={signup.signup_id}>
                    <ListItem
                        secondaryAction={
                            isUpcoming && (
                                <Tooltip title="Cancel Signup">
                                    <IconButton edge="end" onClick={() => handleCancelSignup(signup.signup_id, signup.item_type)}>
                                        <CancelIcon color="error" />
                                    </IconButton>
                                </Tooltip>
                            )
                        }
                    >
                        <ListItemText
                            primary={
                                <Typography variant="h6">
                                    {signup.item_name}
                                    <Chip label={signup.item_type === 'event' ? 'Event' : 'Session'} size="small" sx={{ ml: 2 }} />
                                </Typography>
                            }
                            secondary={`Date: ${new Date(signup.item_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`}
                        />
                        <Chip label={signup.status} color={signup.status === 'Confirmed' ? 'success' : 'default'} />
                    </ListItem>
                    {index < items.length - 1 && <Divider />}
                </div>
            ))}
        </List>
    );

    if (loading) return <Typography>Loading your signups...</Typography>;

    return (
        <Box sx={{ pb: 4 }}>
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
                    Here are all the events and sessions you've signed up for.
                </Typography>
            </Paper>

            {/* Upcoming Signups Section */}
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                Upcoming Signups ({upcomingSignups.length})
            </Typography>
            {upcomingSignups.length > 0 ? (
                renderSignupList(upcomingSignups, true)
            ) : (
                <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary', mb: 4 }}>
                    You haven't signed up for any upcoming events or sessions.
                </Paper>
            )}

            <Divider sx={{ my: 4 }} />

            {/* Past Events Dropdown Accordion Section */}
            <Accordion elevation={3} sx={{ borderRadius: '8px !important', overflow: 'hidden' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                        Past Events & Sessions ({pastSignups.length})
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {pastSignups.length > 0 ? (
                        renderSignupList(pastSignups, false)
                    ) : (
                        <Typography color="text.secondary">No past event signups found.</Typography>
                    )}
                </AccordionDetails>
            </Accordion>
        </Box>
    );
}

export default MySignupsPage;