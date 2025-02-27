import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Container, Typography, Box } from "@mui/material";
import { Masonry } from "@mui/lab";
import EventCard from "./EventTile.jsx";

function EventList() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        async function fetchEvents() {
            let { data, error } = await supabase
                .from("events")
                .select("*")
                .order("date", { ascending: true }); // Sorting events by date (oldest first)

            if (error) {
                console.error("Error fetching events:", error);
            } else {
                setEvents(data);
            }
        }

        fetchEvents();
    }, []);

    return (
        <Container maxWidth={false} sx={{ width: "100vw", paddingY: 4 }}>
            {/* Header */}
            <Box sx={{ width: "100%", textAlign: "center", marginBottom: 2 }}>
                <Typography variant="h4">Upcoming Events</Typography>
            </Box>

            {/* Masonry Layout */}
            <Masonry
                columns={{ xs: 1, sm: 2, md: 3, lg: 4}}
                spacing={2}
                sx={{ width: "100vw", margin: "auto" }}
            >
                {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))}
            </Masonry>
        </Container>
    );
}

export default EventList;


