import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { TextField, Button, Container, Typography, Box, Alert } from '@mui/material';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    const handleReset = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            setError(error.message);
        } else {
            setMessage('Password reset email sent! Check your inbox.');
        }
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    mt: 10, // Moves the form down
                    mx: "auto", // Centers it horizontally
                    p: 3,
                    boxShadow: 3,
                    borderRadius: 2,
                    textAlign: "center", // Centers text inside
                    maxWidth: 400 // Prevents it from being too wide
                }}
            >
                <Typography variant="h4">Reset Password</Typography>
                {error && <Alert severity="error">{error}</Alert>}
                {message && <Alert severity="success">{message}</Alert>}
                <form onSubmit={handleReset}>
                    <TextField fullWidth label="Email" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>Send Reset Link</Button>
                </form>
            </Box>
        </Container>
    );
};

export default ForgotPassword;
