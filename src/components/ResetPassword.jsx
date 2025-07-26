// src/components/UpdatePassword.jsx

import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Container, Typography, Box, Alert } from '@mui/material';

function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Password updated successfully! You can now sign in with your new password.');
            setTimeout(() => {
                navigate('/'); // Redirect to the sign-in page after a short delay
            }, 3000);
        }
    };

    return (
        <Container maxWidth="xs">
            <Box sx={{ mt: 8, textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom>
                    Update Your Password
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}
                {message && <Alert severity="success">{message}</Alert>}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="New Password"
                        type="password"
                        variant="outlined"
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                        Update Password
                    </Button>
                </form>
            </Box>
        </Container>
    );
}

export default UpdatePassword;