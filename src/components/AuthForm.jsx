import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { TextField, Button, Container, Typography, Box, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import fetchUnsplashImage from './UnsplashImg';
import brunelSailingLogo from '../assets/BrunelSailingIcon.jpeg';
import ImageAttribution from './ImageAttribution';

const AuthForm = () => {
    const [view, setView] = useState('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const [backgroundData, setBackgroundData] = useState({ imageUrl: '', photographerName: '', photographerUrl: '' });

    useEffect(() => {
        async function loadBackgroundImage() {
            const data = await fetchUnsplashImage('sailing race');
            if (data) {
                setBackgroundData(data);
            }
        }
        loadBackgroundImage();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        if (view === 'signin') {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setError(error.message);
            } else if (data.user) {
                const { data: profile } = await supabase.from('users').select('student_number').eq('id', data.user.id).single();
                if (profile && profile.student_number) {
                    navigate('/events');
                } else {
                    navigate('/setup');
                }
            }
        } else if (view === 'signup') {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) setError(error.message);
            else setMessage('Signup successful! Check your email to confirm.');
        } else if (view === 'forgot') {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'https://signup.brunelsailing.co.uk/#/',
            });
            if (error) setError(error.message);
            else setMessage('Password reset email sent! Check your inbox.');
        }
    };

    return (
        <Container
            maxWidth="false"
            sx={{
                width: "100vw",
                height: "100vh",
                position: 'relative',
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundImage: `url(${backgroundData.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'background-image 1s ease-in-out'
            }}
        >
            <Box sx={{
                p: 4,
                boxShadow: 8,
                borderRadius: 3,
                maxWidth: 420,
                width: '90%',
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(28, 37, 65, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                color: 'text.primary',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backdropFilter: 'blur(10px)',
            }}>
                <Box
                    component="img"
                    src={brunelSailingLogo}
                    alt="Brunel Sailing Logo"
                    sx={{ height: 80, width: 80, mb: 2, borderRadius: '50%', boxShadow: 2 }}
                />

                <Typography variant="h4" fontWeight="bold" gutterBottom color="text.primary">
                    {view === 'signup' ? 'Sign Up' : view === 'signin' ? 'Sign In' : 'Reset Password'}
                </Typography>

                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
                {message && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{message}</Alert>}

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <TextField
                        fullWidth
                        label="Email Address"
                        variant="outlined"
                        margin="normal"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    {view !== 'forgot' && (
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            variant="outlined"
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    )}
                    <Button type="submit" variant="contained" color="primary" fullWidth size="large" sx={{ mt: 3, py: 1.2, borderRadius: 2 }}>
                        {view === 'signup' ? 'Sign Up' : view === 'signin' ? 'Sign In' : 'Send Reset Link'}
                    </Button>
                </form>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    {view === 'signin' && (
                        <>
                            <Typography variant="body2" color="text.secondary">
                                Don't have an account? <Button variant="text" size="small" onClick={() => setView('signup')}>Sign Up</Button>
                            </Typography>
                            <Button variant="text" size="small" sx={{ mt: 0.5 }} onClick={() => setView('forgot')}>Forgot Password?</Button>
                        </>
                    )}
                    {view === 'signup' && (
                        <Typography variant="body2" color="text.secondary">
                            Already have an account? <Button variant="text" size="small" onClick={() => setView('signin')}>Sign In</Button>
                        </Typography>
                    )}
                    {view === 'forgot' && (
                        <Typography variant="body2" color="text.secondary">
                            Remembered your password? <Button variant="text" size="small" onClick={() => setView('signin')}>Sign In</Button>
                        </Typography>
                    )}
                </Box>
            </Box>

            <ImageAttribution
                photographerName={backgroundData.photographerName}
                photographerUrl={backgroundData.photographerUrl}
            />
        </Container>
    );
};

export default AuthForm;