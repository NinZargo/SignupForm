import { useEffect, useState } from "react";
import {
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    Box,
    FormControlLabel,
    Checkbox
} from "@mui/material";
import { supabase } from "../supabaseClient";

function EventTile({ event }) {
    const [userRole, setUserRole] = useState(null);
    const [open, setOpen] = useState(false);
    const [signups, setSignups] = useState([]);
    const [isSignedUp, setIsSignedUp] = useState(false);
    const [role, setRole] = useState(null);
    const [canDrive, setCanDrive] = useState(false);
    const [needTransport, setNeedTransport] = useState(false);

    // Fetch user role on component mount
    useEffect(() => {
        async function fetchUserRole() {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData.user) {
                console.error("Error fetching user:", userError);
                return;
            }

            const { data, error } = await supabase
                .from("users")
                .select("is_admin, role")
                .eq("id", userData.user.id)
                .single();

            if (error) {
                console.error("Error fetching user role:", error);
                return;
            }

            setUserRole(data.is_admin ? "admin" : "user");
            setRole(data.role);
        }

        fetchUserRole();
    }, []);

    // Handle opening the dialog
    const handleOpen = async () => {
        setOpen(true); // Open the dialog immediately
        await Promise.all([fetchSignups(), checkUserSignup()]); // Run async operations in parallel
    };

    // Handle closing the dialog
    const handleClose = () => {
        setSignups([]);
        setOpen(false);
    };

    // Fetch signups for the event
    const fetchSignups = async () => {
        const { data, error } = await supabase
            .from("signups")
            .select(`
                id,
                user_id,
                event_id,
                transport_needed,
                status,
                can_drive,
                users:signups_user_id_fkey(id, name, email)
            `)
            .eq("event_id", event.id);

        if (error) {
            console.error("Error fetching signups:", error);
            return;
        }

        setSignups(data || []);
    };

    // Check if the current user has signed up for the event
    const checkUserSignup = async () => {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { data, error } = await supabase
            .from("signups")
            .select("id")
            .eq("event_id", event.id)
            .eq("user_id", userData.user.id);

        if (error) {
            console.error("Error checking signup status:", error);
            return;
        }

        setIsSignedUp(data.length > 0);
    };

    // Handle signing up for the event
    const handleSignup = async () => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            console.error("Error fetching user:", userError);
            return;
        }

        const { error } = await supabase.from("signups").insert([
            {
                user_id: userData.user.id,
                event_id: event.id,
                can_drive: canDrive,
                transport_needed: needTransport,
                status: "Pending"
            },
        ]);

        if (error) {
            console.error("Error signing up:", error);
            alert("Failed to sign up. Please try again.");
        } else {
            alert("Successfully signed up!");
            setIsSignedUp(true);
            await fetchSignups(); // Refresh the list
        }
    };

    return (
        <>
            <Card sx={{ mb: 2 }}>
                <CardActionArea onClick={handleOpen}>
                    <CardMedia
                        component="img"
                        height="140"
                        image={event.image_url || "/default-event.jpg"}
                        alt={event.name}
                    />
                    <CardContent>
                        <Typography variant="h5">{event.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                            📅 {new Date(event.date).toLocaleDateString()}
                        </Typography>
                    </CardContent>
                </CardActionArea>
            </Card>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{event.name}</DialogTitle>
                <DialogContent>
                    {event.image_url && (
                        <CardMedia
                            component="img"
                            height="200"
                            image={event.image_url}
                            alt={event.name}
                            sx={{ borderRadius: 2, marginBottom: 2 }}
                        />
                    )}

                    <Typography variant="body1" gutterBottom>
                        {event.description || "No description available."}
                    </Typography>

                    <Typography variant="body2" color="textSecondary">
                        📅 {new Date(event.date).toLocaleDateString()}
                    </Typography>

                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Signups: {signups.length}
                    </Typography>

                    {userRole === "admin" && signups.length > 0 && (
                        <List>
                            {signups.map((signup) => (
                                <ListItem key={signup.users?.id || Math.random()}>
                                    <ListItemText primary={signup.users?.name || `Unknown User`} />
                                </ListItem>
                            ))}
                        </List>
                    )}

                    {/* Transport & Driver Checkboxes */}
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
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                    {!isSignedUp && <Button variant="contained" onClick={handleSignup}>Sign Up</Button>}
                </DialogActions>
            </Dialog>
        </>
    );
}

export default EventTile;