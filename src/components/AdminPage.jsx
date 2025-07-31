import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
    Container,
    Typography,
    Box,
    Paper,
    List,
    ListItem,
    ListItemText,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button,
    IconButton,
    Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const convertToCSV = (data, eventName, eventDate) => {
    const headers = ['Event Name', 'Event Date', 'Member Name', 'Student Number', 'Role', 'Can Drive', 'Needs Transport', 'Status'];
    const rows = data.map(member =>
        [
            `"${eventName}"`,
            `"${eventDate}"`,
            `"${member.name}"`,
            `"${member.student_number || ''}"`,
            `"${member.role}"`,
            member.can_drive,
            member.transport_needed,
            `"${member.status}"`
        ].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
};

function AdminPage() {
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    async function fetchAdminData() {
        try {
            const { data, error } = await supabase.rpc('get_event_transport_details');
            if (error) throw error;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = [];
            const past = [];

            (data || []).forEach(event => {
                if (new Date(event.event_date) >= today) {
                    upcoming.push(event);
                } else {
                    past.push(event);
                }
            });

            setUpcomingEvents(upcoming.sort((a, b) => new Date(a.event_date) - new Date(b.event_date)));
            setPastEvents(past.sort((a, b) => new Date(b.event_date) - new Date(a.event_date)));

        } catch (error) {
            console.error("Error fetching admin data:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAdminData();
    }, []);

    const updateSignupStatus = async (signupId, newStatus) => {
        const { error } = await supabase
            .from('signups')
            .update({ status: newStatus })
            .eq('id', signupId);

        if (error) {
            alert('Failed to update status.');
        } else {
            await fetchAdminData();
        }
    };

    const handleExport = (eventToExport) => {
        if (!eventToExport.members || eventToExport.members.length === 0) {
            alert("There are no signups to export for this event.");
            return;
        }
        const csvData = convertToCSV(eventToExport.members, eventToExport.event_name, eventToExport.event_date);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const safeFilename = eventToExport.event_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.setAttribute('download', `${safeFilename}_signups.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderEvent = (event) => (
        <Paper key={event.event_id} sx={{ mb: 3, p: 3, boxShadow: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Typography variant="h5">{event.event_name}</Typography>
                    <Typography variant="body2" color="textSecondary">{new Date(event.event_date).toLocaleDateString()}</Typography>
                </div>
                <Button variant="outlined" size="small" onClick={() => handleExport(event)}>
                    Export Signups
                </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 2 }}>
                <Chip label={`Total Signups: ${event.total_signups}`} />
                <Chip label={`Passengers Needing Lifts: ${event.passengers_needing_lifts}`} />
                <Chip
                    label={`Available Passenger Spaces: ${event.available_passenger_spaces}`}
                    color={event.available_passenger_spaces >= event.passengers_needing_lifts ? 'success' : 'error'}
                />
            </Box>
            <Accordion sx={{ boxShadow: 'none' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>View Signed-up Members</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <List dense>
                        {event.members && event.members.map(member => (
                            <ListItem
                                key={member.signup_id}
                                secondaryAction={
                                    event.requires_approval && ['Waiting List', 'Pending'].includes(member.status) && (
                                        <>
                                            <IconButton edge="end" title="Confirm" onClick={() => updateSignupStatus(member.signup_id, 'Confirmed')}>
                                                <CheckCircleIcon color="success" />
                                            </IconButton>
                                            <IconButton edge="end" title="Deny" sx={{ ml: 1 }} onClick={() => updateSignupStatus(member.signup_id, 'Cancelled')}>
                                                <CancelIcon color="error" />
                                            </IconButton>
                                        </>
                                    )
                                }
                            >
                                <ListItemText
                                    primary={member.name}
                                    secondary={
                                        (event.requires_approval ? `Status: ${member.status} | ` : '') +
                                        `Student No: ${member.student_number || 'N/A'}` +
                                        ` | Role: ${member.role}` +
                                        (member.can_drive ? ` | Driving (${member.car_spaces} total seats)` : '') +
                                        (member.transport_needed ? ' | Needs Transport' : '')
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </AccordionDetails>
            </Accordion>
        </Paper>
    );

    if (loading) return <Typography>Loading admin data...</Typography>;
    if (error) return <Typography color="error">Error: {error}</Typography>;

    return (
        <Box>
            <Paper
                elevation={4}
                sx={{
                    p: { xs: 2, sm: 3 },
                    mb: 4,
                    borderRadius: 2,
                    textAlign: 'center',
                    background: 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)', // A red gradient for admin
                    color: 'white'
                }}
            >
                <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                    Admin Dashboard
                </Typography>
                <Typography variant="subtitle1">
                    Manage event signups, transport, and member approvals.
                </Typography>
            </Paper>

            <Box sx={{ my: 4 }}>
                <Typography variant="h5" gutterBottom>Upcoming Events</Typography>
                {upcomingEvents.length > 0 ? upcomingEvents.map(renderEvent) : <Typography>No upcoming events with signups.</Typography>}
            </Box>

            <Divider />

            <Box sx={{ my: 4 }}>
                <Typography variant="h5" gutterBottom>Past Events</Typography>
                {pastEvents.length > 0 ? pastEvents.map(renderEvent) : <Typography>No past events with signups.</Typography>}
            </Box>
        </Box>
    );
}

export default AdminPage;