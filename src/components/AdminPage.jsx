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
    Grid,
    Tabs,
    Tab
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import EventIcon from '@mui/icons-material/Event';
import DateRangeIcon from '@mui/icons-material/DateRange';
import HistoryIcon from '@mui/icons-material/History';
import HeaderBanner from './HeaderBanner.jsx';

const convertToCSV = (data, eventName, eventDate) => {
    const headers = [
        'Event Name', 'Event Date', 'Member Name', 'Student Number', 'Role',
        'Can Drive', 'Needs Transport', 'Status', 'Emergency Contact', 'Emergency Phone', 'Medical Notes'
    ];
    const rows = data.map(member =>
        [
            `"${eventName}"`,
            `"${eventDate}"`,
            `"${member.name}"`,
            `"${member.student_number || ''}"`,
            `"${member.role}"`,
            member.can_drive ? 'Yes' : 'No',
            member.transport_needed ? 'Yes' : 'No',
            `"${member.status}"`,
            `"${member.emergency_contact_name || ''}"`,
            `"${member.emergency_contact_phone || ''}"`,
            `"${member.medical_notes || ''}"`
        ].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
};

function AdminPage() {
    const [weeklySessions, setWeeklySessions] = useState([]);
    const [sessionConfigs, setSessionConfigs] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    const [tabValue, setTabValue] = useState(0);
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
            alert('Database RLS Error: Row-level security on table "sessions" blocked update.');
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
        for (const event of oldEvents) {
            try {
                const response = await fetch(event.image_url);
                const imageBlob = await response.blob();
                const fileName = `${Date.now()}_${event.id}.jpeg`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('event-images')
                    .upload(fileName, imageBlob);
                if (uploadError) throw uploadError;
                await supabase.from('events').update({ image_url: uploadData.path }).eq('id', event.id);
            } catch (err) {
                console.error(`Failed to cache image for event ${event.id}:`, err);
            }
        }
        alert("Image caching process complete! Please refresh the page.");
    };

    const renderActivity = (activity) => (
        <Paper key={activity.event_id} elevation={3} sx={{ mb: 3, p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <div>
                    <Typography variant="h5" fontWeight="bold">{activity.event_name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                        📅 {new Date(activity.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </Typography>
                </div>
                <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => handleExport(activity)}>
                    Export Roster (CSV)
                </Button>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, my: 2 }}>
                <Chip label={`Total Signups: ${activity.total_signups}`} color="primary" variant="outlined" />
                <Chip label={`Lifts Needed: ${activity.passengers_needing_lifts}`} color="warning" variant="outlined" />
                <Chip
                    label={`Available Driver Seats: ${activity.available_passenger_spaces}`}
                    color={activity.available_passenger_spaces >= activity.passengers_needing_lifts ? 'success' : 'error'}
                />
            </Box>

            <Accordion elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: '8px !important' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="bold">View Attendee Roster & Medical Details ({activity.members?.length || 0})</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                    <List dense>
                        {activity.members && activity.members.map((member, idx) => (
                            <div key={member.signup_id || member.user_id}>
                                <ListItem
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
                                        primary={
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {member.name}
                                                {member.role === 'Driver' && <Chip label="Driver" color="info" size="small" sx={{ ml: 1 }} />}
                                                {member.transport_needed && <Chip label="Needs Lift" color="warning" size="small" sx={{ ml: 1 }} />}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                                                <Typography variant="body2" component="span" display="block">
                                                    Student No: <strong>{member.student_number || 'N/A'}</strong> | Status: <strong>{member.status}</strong>
                                                </Typography>
                                                {(member.emergency_contact_name || member.emergency_contact_phone) && (
                                                    <Typography variant="body2" component="span" display="block" color="error.main">
                                                        Emergency Contact: {member.emergency_contact_name || 'N/A'} ({member.emergency_contact_phone || 'N/A'})
                                                    </Typography>
                                                )}
                                                {member.medical_notes && (
                                                    <Typography variant="body2" component="span" display="block" color="warning.main">
                                                        Medical/Dietary: {member.medical_notes}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {idx < activity.members.length - 1 && <Divider />}
                            </div>
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
                title="Admin Control Center"
                subtitle="Manage event signups, transport logistics, and weekly session availability."
                bgGradient="linear-gradient(135deg, #d32f2f 0%, #f44336 100%)"
            />

            {/* Clean Tabbed Navigation Bar */}
            <Paper elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, val) => setTabValue(val)}
                    variant="fullWidth"
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab icon={<DateRangeIcon />} label="Weekly Sessions" />
                    <Tab icon={<EventIcon />} label={`Upcoming Events (${upcomingEvents.length})`} />
                    <Tab icon={<HistoryIcon />} label={`Past Events (${pastEvents.length})`} />
                </Tabs>
            </Paper>

            {/* TAB 0: Weekly Sessions & Controls */}
            {tabValue === 0 && (
                <Box>
                    <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Weekly Session Availability Controls
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            Toggle sessions ON to open member signups, or OFF to close signups (e.g. during Taster Sessions or holidays).
                        </Typography>
                        <Grid container spacing={2}>
                            {sessionConfigs.map(s => (
                                <Grid item xs={12} sm={6} key={s.id}>
                                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 2 }}>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="bold">{s.name}</Typography>
                                            <Chip
                                                label={s.is_active !== false ? "Signups Open" : "Session Closed"}
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
                    </Paper>

                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                        This Week's Session Roster & Lifts
                    </Typography>
                    {weeklySessions.length > 0 ? (
                        weeklySessions.map(renderActivity)
                    ) : (
                        <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                            No signups submitted for weekly sessions this week.
                        </Paper>
                    )}
                </Box>
            )}

            {/* TAB 1: Upcoming Events */}
            {tabValue === 1 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" fontWeight="bold">Upcoming Events & Transport</Typography>
                        <Button variant="outlined" color="warning" size="small" onClick={handleCacheOldImages}>
                            Cache Image URLs
                        </Button>
                    </Box>
                    {upcomingEvents.length > 0 ? (
                        upcomingEvents.map(renderActivity)
                    ) : (
                        <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                            No upcoming events with active signups found.
                        </Paper>
                    )}
                </Box>
            )}

            {/* TAB 2: Past Events Archive */}
            {tabValue === 2 && (
                <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                        Past Events Archive
                    </Typography>
                    {pastEvents.length > 0 ? (
                        pastEvents.map(renderActivity)
                    ) : (
                        <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                            No past events found in the archive.
                        </Paper>
                    )}
                </Box>
            )}
        </Box>
    );
}

export default AdminPage;