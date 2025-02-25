import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { TextField, Button, Container, Typography, Box, Alert } from '@mui/material';
import { Link } from 'react-router-dom';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    const handleSignup = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        const { error } = await supabase.auth.signUp({ email, password });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Signup successful! Check your email to confirm your account.');
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
                <Typography variant="h4">Sign Up</Typography>
                {error && <Alert severity="error">{error}</Alert>}
                {message && <Alert severity="success">{message}</Alert>}
                <form onSubmit={handleSignup}>
                    <TextField fullWidth label="Email" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <TextField fullWidth label="Password" type="password" variant="outlined" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>Sign Up</Button>
                </form>
                <Typography variant="body2" sx={{ mt: 2 }}>
                    Already have an account? <Link to="/signin">Sign in</Link>
                </Typography>
            </Box>
        </Container>
    );
};

export default Signup;
