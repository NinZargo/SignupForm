import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { TextField, Button, Container, Typography, Box, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AuthForm = () => {
    const [formType, setFormType] = useState('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        if (formType === 'signup') {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                setError(error.message);
            } else {
                setMessage('Signup successful! Check your email to confirm.');
            }
        } else if (formType === 'signin') {
            // --- THIS IS THE UPDATED SECTION ---
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                setError(error.message);
            } else if (data.user) {
                // After login, check the public.users table for a student number.
                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('student_number')
                    .eq('id', data.user.id)
                    .single();

                // If a profile exists and has a student number, go to the dashboard.
                if (profile && profile.student_number) {
                    navigate('/dashboard');
                } else {
                    // Otherwise, force the user to the setup page to add it.
                    // This also handles cases where a profile doesn't exist yet.
                    navigate('/setup');
                }
            }
            // --- END OF UPDATED SECTION ---
        } else if (formType === 'forgot') {
            const redirectURL = `${window.location.origin}/SignUpForm/#/`;
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectURL,
            });

            if (error) {
                setError(error.message);
            } else {
                setMessage('Password reset email sent! Check your inbox.');
            }
        }
    };

    return (
        <Container maxWidth="false" sx={{ width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Box sx={{ p: 3, boxShadow: 3, borderRadius: 2, textAlign: 'center', maxWidth: 400, width: '100%' }}>
                <Typography variant="h4" gutterBottom>
                    {formType === 'signup' ? 'Sign Up' : formType === 'signin' ? 'Sign In' : 'Reset Password'}
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}
                {message && <Alert severity="success">{message}</Alert>}

                <form onSubmit={handleSubmit}>
                    <TextField fullWidth label="Email" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    {formType !== 'forgot' && (
                        <TextField fullWidth label="Password" type="password" variant="outlined" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    )}
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                        {formType === 'signup' ? 'Sign Up' : formType === 'signin' ? 'Sign In' : 'Send Reset Link'}
                    </Button>
                </form>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    {formType === 'signin' && (
                        <>
                            Don't have an account? <Button variant="text" onClick={() => setFormType('signup')}>Sign Up</Button>
                            <br />
                            <Button variant="text" onClick={() => setFormType('forgot')}>Forgot Password?</Button>
                        </>
                    )}
                    {formType === 'signup' && (
                        <>
                            Already have an account? <Button variant="text" onClick={() => setFormType('signin')}>Sign In</Button>
                        </>
                    )}
                    {formType === 'forgot' && (
                        <>
                            Remembered your password? <Button variant="text" onClick={() => setFormType('signin')}>Sign In</Button>
                        </>
                    )}
                </Typography>
            </Box>
        </Container>
    );
};

export default AuthForm;