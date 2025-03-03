import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
    Container,
    Typography,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    TextareaAutosize
} from "@mui/material";
import { Masonry } from "@mui/lab";
import EventCard from "./EventTile.jsx";
import fetchUnsplashImage from "./UnsplashImg";

function EventList() {
    const [events, setEvents] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [open, setOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ name: "", date: "", image_url: "" });

    // Fetch events
    useEffect(() => {
        async function fetchEvents() {
            let { data, error } = await supabase
                .from("events")
                .select("*")
                .order("date", { ascending: true });

            if (error) {
                console.error("Error fetching events:", error);
            } else {
                setEvents(data);
            }
        }

        async function fetchUserRole() {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData.user) {
                console.error("Error fetching user:", userError);
                return;
            }

            console.log("Logged-in User ID:", userData.user.id); // Debugging

            const { data, error } = await supabase
                .from("users") // Ensure this is the correct table name
                .select("is_admin")
                .eq("id", userData.user.id)
                .single();

            console.log("Supabase Query Result:", data, error);

            if (error) {
                console.error("Error fetching is_admin:", error);
                return;
            }

            setUserRole(data.is_admin ? "admin" : "user");
        }




        fetchEvents();
        fetchUserRole();
    }, []);

    // Open & close modal
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    // Handle form input
    const handleChange = (e) => {
        setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
    };

    // Submit new event to Supabase
    const handleCreateEvent = async () => {
        if (!newEvent.name) {
            alert("Event name is required!");
            return;
        }

        let imageUrl = newEvent.image_url;

        // Fetch Unsplash image if no URL is provided
        if (!imageUrl) {
            imageUrl = await fetchUnsplashImage(newEvent.name);
        }

        const eventData = {
            name: newEvent.name,
            date: newEvent.date,
            location: newEvent.location,
            image_url: imageUrl || "default-image-url.jpg",
        };

        const { data, error } = await supabase.from("events").insert([eventData]).select();

        if (error) {
            console.error("Error creating event:", error);
            alert("Failed to create event");
        } else {
            alert("Event created successfully!");

            // Update the event list in state immediately
            setEvents([...events, ...data]);

            // Reset form and close modal
            setNewEvent({ name: "", date: "", location: "", image_url: "", description: "" });
            setOpen(false);
        }
    };




    return (
        <Container maxWidth={false} sx={{ width: "90vw", paddingY: 4, justifyContent: "center", alignItems: "center" }}>
            {/* Header */}
            <Box sx={{ width: "100%", textAlign: "center", marginBottom: 2 }}>
                <Typography variant="h3">Upcoming Events</Typography>
                {userRole === "admin" && (
                    <Button variant="contained" color="primary" onClick={handleOpen} sx={{ marginTop: 2 }}>
                        + New Event
                    </Button>
                )}
            </Box>

            {/* Event Cards */}
            <Masonry
                columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
                spacing={2}
                sx={{
                    maxWidth: "95vw",
                    margin: "auto",
                    width: "100%"
                }}
            >
                {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))}
            </Masonry>

            {/* Event Creation Modal */}
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogContent>
                    <TextField label="Event Name" name="name" fullWidth onChange={handleChange} sx={{ marginBottom: 2 }} />
                    <TextField label="Date" name="date" type="date" fullWidth onChange={handleChange} InputLabelProps={{ shrink: true }} sx={{ marginBottom: 2 }} />
                    <TextField label="Location" name="location" fullWidth onChange={handleChange} sx={{ marginBottom: 2 }} />
                    <TextField label="Image URL" name="image_url" fullWidth onChange={handleChange} sx={{ marginBottom: 2 }} />
                    <TextareaAutosize
                        minRows={3}
                        placeholder="Enter event description..."
                        style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                        onChange={handleChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleCreateEvent} variant="contained">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default EventList;
