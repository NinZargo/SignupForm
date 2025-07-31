// 1. Import lazy, Suspense, and components for the loading spinner
import { useEffect, lazy, Suspense } from 'react';
import { HashRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import { CssBaseline, Box, CircularProgress } from "@mui/material";
import { supabase } from "./supabaseClient";

import { UserProvider } from './contexts/UserContext';
import Layout from "./components/Layout";
import AuthForm from "./components/AuthForm";

// 2. Convert  page components to be lazy-loaded
const AccountSetup = lazy(() => import('./components/AccountSetup'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const EventSignup = lazy(() => import('./components/EventSignup'));
const MySignups = lazy(() => import('./components/MySignups'));
const UpdatePassword = lazy(() => import('./components/ResetPassword'));
const AccessDenied = lazy(() => import('./components/AccessDenied'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));

// This helper component remains the same
function AppContent() {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.hash.substring(1));
        if (params.has('error_description')) {
            navigate('/access-denied');
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
                navigate('/update-password');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate]);

    return (
        <Routes>
            <Route path="/" element={<AuthForm />} />
            <Route path="/setup" element={<AccountSetup />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/signup/:eventId" element={<Layout><EventSignup /></Layout>} />
            <Route path="/mysignups" element={<Layout><MySignups /></Layout>} />
            <Route
                path="/admin"
                element={
                    <ProtectedRoute>
                        <Layout><AdminPage /></Layout>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <CssBaseline />
            <UserProvider>
                {/* 3. Wrap the AppContent in a Suspense component */}
                <Suspense fallback={
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                        <CircularProgress />
                    </Box>
                }>
                    <AppContent />
                </Suspense>
            </UserProvider>
        </Router>
    );
}

export default App;