import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Container, Typography, Card, CardContent, CardMedia, Button, Box, Checkbox, FormControlLabel } from "@mui/material";

function EventSignup() {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [canDrive, setCanDrive] = useState(false);
    const [needTransport, setNeedTransport] = useState(false);
    const navigate = useNavigate();

    // Fetch Event Details
    useEffect(() => {
        async function fetchEvent() {
            let { data, error } = await supabase
                .from("events")
                .select("*")
                .eq("id", eventId)
                .single();

            if (error) console.error("Error fetching event:", error);
            else setEvent(data);
        }

        fetchEvent();
    }, [eventId]);

    // Fetch Current User Data
    useEffect(() => {
        async function fetchUser() {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) {
                console.error("Error fetching user:", userError);
                return;
            }
            setUser(userData?.user);

            // Fetch User Role from `users` table
            if (userData?.user) {
                const { data: roleData, error: roleError } = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", userData.user.id)
                    .single();

                if (roleError) console.error("Error fetching user role:", roleError);
                else setRole(roleData?.role);
            }
        }

        fetchUser();
    }, []);

    // Handle Signup
    async function handleSignup() {
        if (!user || !event) return;

        const { error } = await supabase.from("signups").insert([
            {
                user_id: user.id,
                event_id: event.id,
                session_id: null, // Modify if you have a session selection system
                can_drive: canDrive,
                transport_needed: needTransport,
                status: "Pending" // Assuming 'pending' is a valid default
            },
        ]);

        if (error) {
            console.error("Error signing up:", error);
            alert("Failed to sign up. Please try again.");
        } else {
            alert("Successfully signed up!");
            navigate("/dashboard");
        }
    }

    if (!event) return <Typography>Loading event details...</Typography>;

    return (
        <Container maxWidth="xl" sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", width: "100vw" }}>
            <Box display="flex" justifyContent="center">
                <Card sx={{ maxWidth: "80%", width: "100%" }}>
                    <CardMedia component="img" height="400" image={event.image_url || "/default-event.jpg"} alt={event.name} />
                    <CardContent>
                        <Typography variant="h4" gutterBottom align="center">{event.name}</Typography>
                        <Typography variant="body1" color="textSecondary" align="center">{event.description}</Typography>
                        <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>📅 {event.date}</Typography>

                        {/* Show Driver Checkbox if user is a driver */}
                        {role === "Driver" ? (
                            <Box display="flex" justifyContent="center" mt={2}>
                                <FormControlLabel
                                    control={<Checkbox checked={canDrive} onChange={(e) => setCanDrive(e.target.checked)} />}
                                    label="I can drive"
                                />
                            </Box>
                        ) : (
                            <Box display="flex" justifyContent="center" mt={2}>
                                <FormControlLabel
                                    control={<Checkbox checked={needTransport} onChange={(e) => setNeedTransport(e.target.checked)} />}
                                    label="I need Transport"
                                />
                            </Box>
                        )}

                        <Box display="flex" justifyContent="center" mt={3}>
                            <Button variant="contained" color="primary" onClick={handleSignup}>Sign Up</Button>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
}

export default EventSignup;

