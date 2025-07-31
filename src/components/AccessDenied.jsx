import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Box, Alert } from '@mui/material';

function AccessDenied() {
    const navigate = useNavigate();
    const location = useLocation();

    const params = new URLSearchParams(location.hash.substring(1));
    const errorMessage = params.get('error_description');

    return (
        <Container maxWidth="false" sx={{ width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Box sx={{ textAlign: 'center', p: 3, border: '1px solid #ddd', borderRadius: 2, maxWidth: '500px' }}>
                <Typography variant="h4" color="error" gutterBottom>
                    Access Denied
                </Typography>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {errorMessage ? errorMessage.replace(/\+/g, ' ') : 'This link is invalid or has expired.'}
                </Alert>
                <Button variant="contained" onClick={() => navigate('/')}>
                    Return to Sign In
                </Button>
            </Box>
        </Container>
    );
}

export default AccessDenied;