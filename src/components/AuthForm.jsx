import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { TextField, Button, Container, Typography, Box, Alert, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import fetchUnsplashImage from './UnsplashImg';
import brunelSailingLogo from '../assets/BrunelSailingIcon.jpeg';
import ImageAttribution from './ImageAttribution'; // Import the new component

const AuthForm = () => {
    const [view, setView] = useState('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    // This state now holds the full image data object
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
                redirectTo: 'https://ninzargo.github.io/SignUpForm/#/',
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
                position: 'relative', // Add position relative for the attribution
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
                boxShadow: 5,
                borderRadius: 2,
                maxWidth: 400,
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}>
                <Box
                    component="img"
                    src={brunelSailingLogo}
                    alt="Brunel Sailing Logo"
                    sx={{ height: 80, width: 80, mb: 2, borderRadius: '50%' }}
                />

                <Typography variant="h4" gutterBottom>
                    {view === 'signup' ? 'Sign Up' : view === 'signin' ? 'Sign In' : 'Reset Password'}
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}
                {message && <Alert severity="success">{message}</Alert>}

                <form onSubmit={handleSubmit}>
                    <TextField fullWidth label="Email" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    {view !== 'forgot' && (
                        <TextField fullWidth label="Password" type="password" variant="outlined" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    )}
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                        {view === 'signup' ? 'Sign Up' : view === 'signin' ? 'Sign In' : 'Send Reset Link'}
                    </Button>
                </form>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    {view === 'signin' && (
                        <>
                            Don't have an account? <Button variant="text" onClick={() => setView('signup')}>Sign Up</Button>
                            <br />
                            <Button variant="text" onClick={() => setView('forgot')}>Forgot Password?</Button>
                        </>
                    )}
                    {view === 'signup' && ( <> Already have an account? <Button variant="text" onClick={() => setView('signin')}>Sign In</Button> </> )}
                    {view === 'forgot' && ( <> Remembered your password? <Button variant="text" onClick={() => setView('signin')}>Sign In</Button> </> )}
                </Typography>
            </Box>

            {/* Render the new attribution component */}
            <ImageAttribution
                photographerName={backgroundData.photographerName}
                photographerUrl={backgroundData.photographerUrl}
            />
        </Container>
    );
};

export default AuthForm;