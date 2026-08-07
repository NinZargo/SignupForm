import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
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
    Divider,
    FormControlLabel,
    Switch,
    Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HeaderBanner from './HeaderBanner.jsx';

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
    const [weeklySessions, setWeeklySessions] = useState([]);
    const [sessionConfigs, setSessionConfigs] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    async function fetchAdminData() {
        try {
            const [eventsResponse, sessionsResponse, configsResponse] = await Promise.all([
                supabase.rpc('get_event_transport_details'),
                supabase.rpc('get_session_transport_details'),
                supabase.from('sessions').select('*')
            ]);

            if (eventsResponse.error) throw eventsResponse.error;
            if (sessionsResponse.error) throw sessionsResponse.error;

            const sortedSessions = (sessionsResponse.data || []).sort((a, b) => (a.event_name || '').localeCompare(b.event_name || ''));
            const sortedConfigs = (configsResponse.data || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            setWeeklySessions(sortedSessions);
            setSessionConfigs(sortedConfigs);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const upcoming = [];
            const past = [];
            (eventsResponse.data || []).forEach(event => {
                if (new Date(event.event_date) >= today) {
                    upcoming.push(event);
                } else {
                    past.push(event);
                }
            });
            setUpcomingEvents(upcoming.sort((a, b) => new Date(a.event_date) - new Date(b.event_date)));
            setPastEvents(past.sort((a, b) => new Date(b.event_date) - new Date(a.event_date)));

        } catch (err) {
            console.error("Error fetching admin data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAdminData();
    }, []);

    const toggleSessionActive = async (sessionId, currentActive) => {
        const newStatus = currentActive === false ? true : false;

        setSessionConfigs(prev => prev.map(s => s.id === sessionId ? { ...s, is_active: newStatus } : s));

        const { data, error } = await supabase
            .from('sessions')
            .update({ is_active: newStatus })
            .eq('id', sessionId)
            .select();

        if (error || !data || data.length === 0) {
            alert('Database RLS Error: Row-level security on table "sessions" blocked update. Please run the UPDATE policy in Supabase.');
            await fetchAdminData();
        } else {
            await fetchAdminData();
        }
    };

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

    const handleCacheOldImages = async () => {
        alert("Starting image caching process. This may take a few moments. Check the console for progress.");
        const { data: oldEvents, error: fetchError } = await supabase
            .from('events')
            .select('id, image_url')
            .like('image_url', 'http%');
        if (fetchError) return alert(`Error fetching old events: ${fetchError.message}`);
        if (oldEvents.length === 0) return alert("No old images to cache!");
        console.log(`Found ${oldEvents.length} events to migrate.`);
        for (const event of oldEvents) {
            try {
                console.log(`Caching image for event ID: ${event.id}`);
                const response = await fetch(event.image_url);
                const imageBlob = await response.blob();
                const fileName = `${Date.now()}_${event.id}.jpeg`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('event-images')
                    .upload(fileName, imageBlob);
                if (uploadError) throw uploadError;
                const { error: updateError } = await supabase
                    .from('events')
                    .update({ image_url: uploadData.path })
                    .eq('id', event.id);
                if (updateError) throw updateError;
                console.log(`Successfully cached image for event ID: ${event.id}`);
            } catch (err) {
                console.error(`Failed to cache image for event ${event.id}:`, err);
            }
        }
        alert("Image caching process complete! Please refresh the page.");
    };

    const renderActivity = (activity) => (
        <Paper key={activity.event_id} sx={{ mb: 3, p: 3, boxShadow: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Typography variant="h5">{activity.event_name}</Typography>
                    <Typography variant="body2" color="textSecondary">{new Date(activity.event_date).toLocaleDateString()}</Typography>
                </div>
                <Button variant="outlined" size="small" onClick={() => handleExport(activity)}>
                    Export Signups
                </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 2 }}>
                <Chip label={`Total Signups: ${activity.total_signups}`} />
                <Chip label={`Passengers Needing Lifts: ${activity.passengers_needing_lifts}`} />
                <Chip
                    label={`Available Passenger Spaces: ${activity.available_passenger_spaces}`}
                    color={activity.available_passenger_spaces >= activity.passengers_needing_lifts ? 'success' : 'error'}
                />
            </Box>
            <Accordion sx={{ boxShadow: 'none' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>View Signed-up Members</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <List dense>
                        {activity.members && activity.members.map(member => (
                            <ListItem
                                key={member.signup_id || member.user_id}
                                secondaryAction={
                                    activity.requires_approval && ['Waiting List', 'Pending'].includes(member.status) && (
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
                                        (activity.requires_approval ? `Status: ${member.status} | ` : '') +
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

    if (loading) return <Typography sx={{ p: 4 }}>Loading admin data...</Typography>;
    if (error) return <Typography color="error" sx={{ p: 4 }}>Error: {error}</Typography>;

    return (
        <Box sx={{ pb: 4 }}>
            <HeaderBanner
                title="Admin Dashboard"
                subtitle="Manage event signups, transport, and member approvals."
                bgGradient="linear-gradient(135deg, #d32f2f 0%, #f44336 100%)"
            />

            <Box sx={{ mb: 4 }}>
                <Button variant="contained" color="warning" onClick={handleCacheOldImages}>Cache Old Images</Button>
            </Box>

            {/* Weekly Session Status Toggles */}
            <Box sx={{ my: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>Weekly Session Signups Control</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Toggle sessions ON to open signups for this week, or OFF to close signups (e.g. during Taster Sessions or holidays).
                </Typography>
                <Grid container spacing={2}>
                    {sessionConfigs.map(s => (
                        <Grid item xs={12} sm={6} key={s.id}>
                            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 2 }}>
                                <Box>
                                    <Typography variant="h6">{s.name}</Typography>
                                    <Chip
                                        label={s.is_active !== false ? "Active / Open" : "Not Running / Closed"}
                                        color={s.is_active !== false ? "success" : "error"}
                                        size="small"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Box>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={s.is_active !== false}
                                            onChange={() => toggleSessionActive(s.id, s.is_active)}
                                            color="success"
                                        />
                                    }
                                    label={s.is_active !== false ? "Open" : "Closed"}
                                />
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ my: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>Weekly Sessions (This Week Signups)</Typography>
                {weeklySessions.length > 0 ? weeklySessions.map(renderActivity) : <Typography color="textSecondary">No signups for sessions this week.</Typography>}
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ my: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>Upcoming Events</Typography>
                {upcomingEvents.length > 0 ? upcomingEvents.map(renderActivity) : <Typography color="textSecondary">No upcoming events with signups.</Typography>}
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ my: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>Past Events</Typography>
                {pastEvents.length > 0 ? pastEvents.map(renderActivity) : <Typography color="textSecondary">No past events with signups.</Typography>}
            </Box>
        </Box>
    );
}

export default AdminPage;