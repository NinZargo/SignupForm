import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
    Container,
    Typography,
    CircularProgress,
    Box,
    Paper,
    List,
    ListItem,
    ListItemText,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// This helper function now converts a specific data structure to a CSV string
const convertToCSV = (data, eventName, eventDate) => {
    const headers = ['Event Name', 'Event Date', 'Member Name', 'Student Number', 'Role', 'Can Drive', 'Needs Transport'];
    const rows = data.map(member =>
        [
            `"${eventName}"`,
            `"${eventDate}"`,
            `"${member.name}"`,
            `"${member.student_number || ''}"`,
            `"${member.role}"`,
            member.can_drive,
            member.transport_needed
        ].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
};

function AdminPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchAdminData() {
            try {
                const { data, error } = await supabase.rpc('get_event_transport_details');
                if (error) throw error;
                setEvents(data);
            } catch (error) {
                console.error("Error fetching admin data:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchAdminData();
    }, []);

    // The export function now accepts a specific event's data
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

        // Sanitize the event name for the filename
        const safeFilename = eventToExport.event_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.setAttribute('download', `${safeFilename}_signups.csv`);

        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        // Return a centered spinner instead of just text
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }
    if (error) return <Typography color="error">Error: {error}</Typography>;

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>

            {events.map(event => (
                <Paper key={event.event_id} sx={{ mb: 3, p: 3, boxShadow: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <Typography variant="h5">{event.event_name}</Typography>
                            <Typography variant="body2" color="textSecondary">{new Date(event.event_date).toLocaleDateString()}</Typography>
                        </div>
                        {/* The Export Button is now here, inside each event card */}
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
                                {event.members.map(member => (
                                    <ListItem key={member.id}>
                                        <ListItemText
                                            primary={member.name}
                                            secondary={
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
            ))}
        </Container>
    );
}

export default AdminPage;