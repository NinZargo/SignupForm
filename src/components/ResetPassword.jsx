// src/components/ResetPassword.jsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { TextField, Button, Container, Typography, Box, Alert } from '@mui/material';

function UpdatePassword() {
    const [password,        setPassword]        = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error,           setError]           = useState(null);
    const [message,         setMessage]         = useState('');
    const navigate = useNavigate();
    const { setRecoveryMode } = useUser();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Password updated! Redirecting to login...');
            setRecoveryMode(false);
            await supabase.auth.signOut();
            setTimeout(() => navigate('/'), 2500);
        }
    };

    return (
        <Container maxWidth="false" sx={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box sx={{ p: 4, boxShadow: 6, borderRadius: 3, maxWidth: 460, width: '90%', textAlign: 'center',
                backgroundColor: (t) => t.palette.mode === 'dark' ? 'rgba(28,37,65,0.97)' : 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(10px)',
            }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                    Reset Your Password
                </Typography>

                {error   && <Alert severity="error"   sx={{ mb: 2, textAlign: 'left' }}>{error}</Alert>}
                {message && <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>{message}</Alert>}

                {!message && (
                    <form onSubmit={handleSubmit}>
                        <TextField fullWidth label="New Password" type="password" variant="outlined"
                            margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <TextField fullWidth label="Confirm Password" type="password" variant="outlined"
                            margin="normal" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, py: 1.4 }}>
                            Update Password
                        </Button>
                        <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={() => navigate('/')}>
                            Back to Login
                        </Button>
                    </form>
                )}
            </Box>
        </Container>
    );
}

export default UpdatePassword;