import {
    Box, Typography, List, ListItem, ListItemText, Chip, Paper, Divider, IconButton, Tooltip,
    Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HeaderBanner from './HeaderBanner.jsx';
import { useMySignups } from '../hooks/useMySignups.js';

function MySignupsPage() {
    const { upcomingSignups, pastSignups, loading, cancelSignup } = useMySignups();

    const handleCancel = async (signupId, itemType) => {
        try {
            await cancelSignup(signupId, itemType);
            alert("Your signup has been cancelled.");
        } catch (error) {
            alert(`Failed to cancel signup: ${error.message}`);
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
                                    <IconButton edge="end" onClick={() => handleCancel(signup.signup_id, signup.item_type)}>
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

    if (loading) return <Typography sx={{ p: 4 }}>Loading your signups...</Typography>;

    return (
        <Box sx={{ pb: 4 }}>
            <HeaderBanner
                title="My Signups"
                subtitle="Here are all the events and sessions you've signed up for."
                bgGradient="linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)"
            />

            {/* Upcoming Signups Section */}
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
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
                    <Typography variant="h6" fontWeight="bold">
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