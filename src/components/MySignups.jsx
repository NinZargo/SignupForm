// src/pages/MySignups.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../contexts/UserContext';
import {
    Box, Typography, List, ListItem, ListItemText, Chip, Paper, Divider, IconButton, Tooltip
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';

function MySignupsPage() {
    const { profile } = useUser();
    const [signups, setSignups] = useState([]);
    const [loading, setLoading] = useState(true);

    // I've extracted your fetching logic so we can call it again after a cancellation.
    const fetchMySignups = async () => {
        if (!profile) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase.rpc('get_my_signups', { p_user_id: profile.id });

        if (error) {
            console.error("Failed to fetch signups:", error);
        } else {
            const sortedSignups = data.sort((a, b) => new Date(a.item_date) - new Date(b.item_date));
            setSignups(sortedSignups);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMySignups();
    }, [profile]);

    // This new function handles the cancellation logic.
    const handleCancelSignup = async (signupId, itemType) => {
        // 1. Determine which table to delete from based on the item_type.
        const tableName = itemType === 'session' ? 'session_signups' : 'signups';

        // 2. Perform the delete operation on the correct table.
        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', signupId);

        if (error) {
            alert(`Failed to cancel signup: ${error.message}`);
        } else {
            alert("Your signup has been cancelled.");
            // 3. Refresh the list to show the change immediately.
            await fetchMySignups();
        }
    };

    if (loading) return <Typography>Loading your signups...</Typography>;

    return (
        <Box>
            {/* Your custom header paper is preserved. */}
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

            {signups.length > 0 ? (
                <List component={Paper}>
                    {signups.map((signup, index) => (
                        <div key={signup.signup_id}>
                            <ListItem
                                // 4. A cancel button is added here using secondaryAction.
                                secondaryAction={
                                    <Tooltip title="Cancel Signup">
                                        <IconButton edge="end" onClick={() => handleCancelSignup(signup.signup_id, signup.item_type)}>
                                            <CancelIcon color="error" />
                                        </IconButton>
                                    </Tooltip>
                                }
                            >
                                <ListItemText
                                    primary={
                                        <Typography variant="h6">
                                            {signup.item_name}
                                            <Chip label={signup.item_type === 'event' ? 'Event' : 'Session'} size="small" sx={{ ml: 2 }} />
                                        </Typography>
                                    }
                                    secondary={`Date: ${new Date(signup.item_date).toLocaleDateString()}`}
                                />
                                <Chip label={signup.status} color={signup.status === 'Confirmed' ? 'success' : 'default'} />
                            </ListItem>
                            {index < signups.length - 1 && <Divider />}
                        </div>
                    ))}
                </List>
            ) : (
                <Typography>You haven't signed up for any upcoming events or sessions.</Typography>
            )}
        </Box>
    );
}

export default MySignupsPage;