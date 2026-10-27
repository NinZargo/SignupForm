import { useState } from 'react';
import {
    Box, Typography, List, ListItem, ListItemText, Chip, Paper, Divider, IconButton, Tooltip,
    Accordion, AccordionSummary, AccordionDetails, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EventIcon from '@mui/icons-material/Event';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HeaderBanner from './HeaderBanner.jsx';
import { useMySignups } from '../hooks/useMySignups.js';

function MySignupsPage() {
    const { upcomingSignups, pastSignups, loading, cancelSignup } = useMySignups();
    const [cancelConfirm, setCancelConfirm] = useState({ open: false, signupId: null, itemType: null, name: '' });

    const handleOpenCancelConfirm = (signupId, itemType, name) => {
        setCancelConfirm({ open: true, signupId, itemType, name });
    };

    const handleCloseCancelConfirm = () => {
        setCancelConfirm({ open: false, signupId: null, itemType: null, name: '' });
    };

    const handleConfirmCancel = async () => {
        try {
            await cancelSignup(cancelConfirm.signupId, cancelConfirm.itemType);
            handleCloseCancelConfirm();
        } catch (error) {
            alert(`Failed to cancel signup: ${error.message}`);
        }
    };

    const getStatusChipProps = (status) => {
        if (status === 'Confirmed' || status === 'Attending') {
            return { label: 'Confirmed', color: 'success', icon: <CheckCircleOutlineIcon /> };
        }
        if (status === 'Cancelled' || status === 'Denied') {
            return { label: 'Cancelled', color: 'error', icon: <CancelIcon /> };
        }
        return { label: 'On Waitlist', color: 'warning', icon: <HourglassEmptyIcon /> };
    };

    const renderSignupList = (items, isUpcoming = true) => (
        <List component={Paper} elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            {items.map((signup, index) => {
                const statusProps = getStatusChipProps(signup.status);
                return (
                    <div key={signup.signup_id}>
                        <ListItem
                            sx={{ p: 2.5 }}
                            secondaryAction={
                                isUpcoming && (
                                    <Tooltip title="Cancel Signup">
                                        <IconButton
                                            edge="end"
                                            color="error"
                                            onClick={() => handleOpenCancelConfirm(signup.signup_id, signup.item_type, signup.item_name)}
                                        >
                                            <CancelIcon />
                                        </IconButton>
                                    </Tooltip>
                                )
                            }
                        >
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.15rem' }}>
                                            {signup.item_name}
                                        </Typography>
                                        <Chip
                                            icon={signup.item_type === 'event' ? <EventIcon fontSize="small" /> : <DateRangeIcon fontSize="small" />}
                                            label={signup.item_type === 'event' ? 'Event' : 'Weekly Session'}
                                            size="small"
                                            variant="outlined"
                                            color="primary"
                                        />
                                        <Chip
                                            icon={statusProps.icon}
                                            label={statusProps.label}
                                            color={statusProps.color}
                                            size="small"
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </Box>
                                }
                                secondary={
                                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                        📅 {new Date(signup.item_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </Typography>
                                }
                            />
                        </ListItem>
                        {index < items.length - 1 && <Divider />}
                    </div>
                );
            })}
        </List>
    );

    if (loading) return <Typography sx={{ p: 4 }}>Loading your signups...</Typography>;

    return (
        <Box sx={{ pb: 4 }}>
            <HeaderBanner
                title="My Signups"
                subtitle="Here are all the events and weekly sessions you've signed up for."
                bgGradient="linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)"
            />

            {/* Upcoming Signups Section */}
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                Upcoming Signups ({upcomingSignups.length})
            </Typography>
            {upcomingSignups.length > 0 ? (
                renderSignupList(upcomingSignups, true)
            ) : (
                <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary', mb: 4, borderRadius: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold">No upcoming signups yet!</Typography>
                    <Typography variant="body2">Check out the Events page to request a spot for upcoming activities.</Typography>
                </Paper>
            )}

            <Divider sx={{ my: 4 }} />

            {/* Past Events Dropdown Accordion Section */}
            <Accordion elevation={3} sx={{ borderRadius: '12px !important', overflow: 'hidden' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6" fontWeight="bold">
                        Past Events & Sessions Archive ({pastSignups.length})
                    </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                    {pastSignups.length > 0 ? (
                        renderSignupList(pastSignups, false)
                    ) : (
                        <Box sx={{ p: 3 }}>
                            <Typography color="text.secondary">No past event signups found.</Typography>
                        </Box>
                    )}
                </AccordionDetails>
            </Accordion>

            {/* Cancel Confirmation Dialog */}
            <Dialog
                open={cancelConfirm.open}
                onClose={handleCloseCancelConfirm}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle fontWeight="bold">Cancel Signup?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to cancel your signup for <strong>{cancelConfirm.name}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseCancelConfirm} sx={{ textTransform: 'none' }}>Keep Signup</Button>
                    <Button variant="contained" color="error" onClick={handleConfirmCancel} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}>
                        Confirm Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default MySignupsPage;