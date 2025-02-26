import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { TextField, Button, Container, Typography, Box, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AuthForm = () => {
    const [formType, setFormType] = useState('signin'); // 'signin', 'signup', 'forgot'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        let response;
        if (formType === 'signup') {
            response = await supabase.auth.signUp({ email, password });
        } else if (formType === 'signin') {
            response = await supabase.auth.signInWithPassword({ email, password });
        } else if (formType === 'forgot') {
            response = await supabase.auth.resetPasswordForEmail(email);
        }

        if (response.error) {
            setError(response.error.message);
        } else {
            if (formType === 'signup') {
                setMessage('Signup successful! Check your email to confirm.');
            } else if (formType === 'signin') {
                const { user } = response.data;

                if (user) {
                    console.log(user.user_metadata);
                    const { setup_complete } = user.user_metadata || {};

                    if (!setup_complete) {
                        navigate('/setup'); // Redirect to account setup
                    } else {
                        navigate('/dashboard'); // Redirect to dashboard
                    }
                }
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
                            Don&#39;t have an account? <Button variant="text" onClick={() => setFormType('signup')}>Sign Up</Button>
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
