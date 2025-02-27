import { Card, CardMedia, CardContent, Typography } from "@mui/material";

function EventCard({ event }) {
    return (
        <Card sx={{ mb: 2 }}>
            {event.image_url && (
                <CardMedia component="img" height="200" image={event.image_url} alt={event.name} />
            )}
            <CardContent>
                <Typography variant="h5">{event.name}</Typography>
                <Typography variant="body2" color="textSecondary">{event.description}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>📅 {event.date}</Typography>
            </CardContent>
        </Card>
    );
}

export default EventCard;
