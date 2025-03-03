import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Container, Typography, Card, CardContent, Button, Box } from "@mui/material";

function MySignups() {
    const [signups, setSignups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true; // Prevents state updates after unmounting

        async function fetchSignups() {
            try {
                const { data: userData, error: userError } = await supabase.auth.getUser();
                if (userError || !userData?.user) {
                    console.error("Error fetching user:", userError);
                    return;
                }

                const userId = userData.user.id;

                const { data, error } = await supabase
                    .from("signups")
                    .select("id, event_id, events(name, date, image_url)") // Fetch event details
                    .eq("user_id", userId);

                if (error) {
                    console.error("Error fetching signups:", error);
                } else if (isMounted) {
                    // Sort manually in JavaScript
                    const sortedData = data.sort((a, b) => new Date(a.events.date) - new Date(b.events.date));
                    setSignups(sortedData);
                }
            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchSignups();

        return () => {
            isMounted = false;
        };
    }, []);

    async function cancelSignup(signupId) {
        const { error } = await supabase
            .from("signups")
            .delete()
            .eq("id", signupId);

        if (error) {
            console.error("Error canceling signup:", error);
            alert("Failed to cancel signup.");
        } else {
            alert("Signup canceled successfully!");
            setSignups(signups.filter(signup => signup.id !== signupId));
        }
    }

    if (loading) return <Typography>Loading your signed-up events...</Typography>;

    return (
        <Container maxWidth="md">
            <Typography variant="h4" gutterBottom>My Signups</Typography>
            {signups.length === 0 ? (
                <Typography>No signed-up events.</Typography>
            ) : (
                signups.map(({ id, event_id, events }) => (
                    <Card key={event_id} sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h5">{events.name}</Typography>
                            <Typography variant="body2">📅 {events.date}</Typography>
                            <Box display="flex" justifyContent="space-between" mt={2}>
                                <Button variant="contained" color="secondary" onClick={() => cancelSignup(id)}>
                                    Cancel Signup
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                ))
            )}
        </Container>
    );
}

export default MySignups;
