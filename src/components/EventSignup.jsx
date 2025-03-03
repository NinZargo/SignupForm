import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, List, ListItem, ListItemText, Button, Checkbox, FormControlLabel } from "@mui/material";
import { supabase } from "../supabaseClient";

function EventSignup({ open, handleClose, event, userRole, fetchSignups, signups }) {
    const [user, setUser] = useState(null);
    const [canDrive, setCanDrive] = useState(false);
    const [needTransport, setNeedTransport] = useState(false);
    const [isSignedUp, setIsSignedUp] = useState(false);

    // Fetch current user data
    useEffect(() => {
        async function fetchUser() {
            const { data: userData, error } = await supabase.auth.getUser();
            if (error) {
                console.error("Error fetching user:", error);
                return;
            }
            setUser(userData?.user);

            // Check if user is already signed up
            if (userData?.user) {
                const { data: existingSignup, error: signupError } = await supabase
                    .from("signups")
                    .select("*")
                    .eq("user_id", userData.user.id)
                    .eq("event_id", event.id)
                    .single();

                if (signupError && signupError.code !== "PGRST116") {
                    console.error("Error checking signup:", signupError);
                } else if (existingSignup) {
                    setIsSignedUp(true);
                }
            }
        }

        if (event) fetchUser();
    }, [event]);

    // Handle signup
    async function handleSignup() {
        if (!user || !event) return;

        const { error } = await supabase.from("signups").insert([
            {
                user_id: user.id,
                event_id: event.id,
                can_drive: canDrive,
                transport_needed: needTransport,
                status: "Pending",
            },
        ]);

        if (error) {
            console.error("Error signing up:", error);
            alert("Failed to sign up. Please try again.");
        } else {
            alert("Successfully signed up!");
            setIsSignedUp(true);
            fetchSignups(); // Refresh signups list
        }
    }

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{event.name}</DialogTitle>
            <DialogContent>
                <Typography variant="body1" gutterBottom>
                    {event.description || "No description available."}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    📅 {new Date(event.date).toLocaleDateString()}
                </Typography>

                {/* Show total signups */}
                <Typography variant="h6" sx={{ mt: 2 }}>
                    Signups: {signups.length}
                </Typography>

                {/* Show full signup list only for admins */}
                {userRole === "admin" && signups.length > 0 && (
                    <List>
                        {signups.map((signup) => (
                            <ListItem key={signup.users.id}>
                                <ListItemText primary={signup.users?.name || "Unknown User"} />
                            </ListItem>
                        ))}
                    </List>
                )}

                {/* Signup options for users */}
                {user && !isSignedUp && (
                    <>
                        <FormControlLabel
                            control={<Checkbox checked={canDrive} onChange={(e) => setCanDrive(e.target.checked)} />}
                            label="I can drive"
                        />
                        <FormControlLabel
                            control={<Checkbox checked={needTransport} onChange={(e) => setNeedTransport(e.target.checked)} />}
                            label="I need transport"
                        />
                        <Button variant="contained" color="primary" onClick={handleSignup} sx={{ mt: 2 }}>
                            Sign Up
                        </Button>
                    </>
                )}

                {isSignedUp && <Typography color="primary">✅ You are signed up for this event.</Typography>}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Close</Button>
                {userRole === "admin" && (
                    <Button variant="contained" onClick={fetchSignups}>
                        Refresh Signups
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default EventSignup;
