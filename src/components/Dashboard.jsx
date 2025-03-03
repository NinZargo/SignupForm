import { Box, Typography, Button, Container, Grid, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import EventList from "./EventList";

function Dashboard() {
    const navigate = useNavigate();

    return (
        <Container maxWidth="false">
            {/* Header Box */}
            <EventList />

        </Container>
    );
}

export default Dashboard;
