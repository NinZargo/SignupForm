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
    ListItemText
} from "@mui/material";
import { supabase } from "../supabaseClient";

function EventTile({ event }) {
    const [userRole, setUserRole] = useState(null);
    const [open, setOpen] = useState(false);
    const [signups, setSignups] = useState([]);

    useEffect(() => {
        async function fetchUserRole() {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData.user) {
                console.error("Error fetching user:", userError);
                return;
            }

            const { data, error } = await supabase
                .from("users")
                .select("is_admin")
                .eq("id", userData.user.id)
                .single();

            if (error) {
                console.error("Error fetching is_admin:", error);
                return;
            }

            setUserRole(data.is_admin ? "admin" : "user");
        }

        fetchUserRole();
    }, []);

    const handleOpen = () => {
        fetchSignups();
        setOpen(true);
    }
    const handleClose = () => {
        setSignups([]); // Clear signups when closing
        setOpen(false);
    };

    // Fetch signups when "View Signups" is clicked
    const fetchSignups = async () => {
        const { data, error } = await supabase
            .from("signups")
            .select("users!signups_user_id_fkey(id, name, email)") // Ensure correct foreign key
            .eq("event_id", event.id); // Use event.id instead of selectedEventId

        if (error) {
            console.error("Error fetching signups:", error);
            return;
        }

        console.log("Fetched signups:", data);
        setSignups(data || []);
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
                    {/* Display event image */}
                    {event.image_url && (
                        <CardMedia
                            component="img"
                            height="200"
                            image={event.image_url} // Ensure this is a valid URL
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
                    {/* Show number of signups for all users */}
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Signups: {signups.length}
                    </Typography>

                    {/* Show full signups list ONLY for admins */}
                    {userRole === "admin" && signups.length > 0 && (
                        <List>
                            {signups.map((signup) => (
                                <ListItem key={signup.users.id}>
                                    <ListItemText primary={signup.users?.name || "Unknown User"} />
                                </ListItem>
                            ))}
                        </List>
                    )}

                    <DialogActions>
                        <Button onClick={handleClose}>Close</Button>

                        {/* Only show "View Signups" button if the user is an admin */}
                        {userRole === "admin" && (
                            <Button variant="contained" onClick={fetchSignups}>
                                View Signups
                            </Button>
                        )}
                    </DialogActions>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default EventTile;
