import { Paper, Typography, Box } from '@mui/material';

export default function HeaderBanner({ title, subtitle, bgGradient, actionButton }) {
    const defaultGradient = 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)';

    return (
        <Paper
            elevation={4}
            sx={{
                p: { xs: 3, sm: 4 },
                mb: 4,
                borderRadius: 3,
                textAlign: 'center',
                background: bgGradient || defaultGradient,
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }}
        >
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                {title}
            </Typography>
            {subtitle && (
                <Typography variant="subtitle1" sx={{ mb: actionButton ? 2 : 0, opacity: 0.9 }}>
                    {subtitle}
                </Typography>
            )}
            {actionButton && (
                <Box sx={{ mt: 2 }}>
                    {actionButton}
                </Box>
            )}
        </Paper>
    );
}
