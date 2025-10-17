// src/App.jsx
import { useEffect, lazy, Suspense } from 'react';
import { HashRouter as Router, Route, Routes, useNavigate, Navigate, Outlet } from "react-router-dom";
import { CssBaseline, Box, CircularProgress } from "@mui/material";
import { supabase } from "./supabaseClient";
import { UserProvider, useUser } from './contexts/UserContext';
import Layout from "./components/Layout";
import AuthForm from "./components/AuthForm";

// Lazy-loaded components
const AccountSetup = lazy(() => import('./components/AccountSetup'));
const Events = lazy(() => import('./components/EventList.jsx'));
const MySignups = lazy(() => import('./components/MySignups'));
const UpdatePassword = lazy(() => import('./components/ResetPassword'));
const AccessDenied = lazy(() => import('./components/AccessDenied'));
const AdminPage = lazy(() => import('./components/AdminPage'));

// --- THE CORRECTED PROTECTED ROUTE ---
const ProtectedRoute = () => {
    const { session, profile, loading } = useUser(); // Get the loading state

    // 1. If we are loading, show a spinner and DO NOT REDIRECT.
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // 2. Once loading is false, check for a session.
    if (!session) {
        return <Navigate to="/" replace />;
    }

    // 3. If there is a session, check if the profile is complete.
    if (!profile?.name) { // Use whatever field indicates a complete profile
        return <Navigate to="/setup" replace />;
    }

    // 4. If all checks pass, show the page.
    return (
        <Layout>
            <Outlet />
        </Layout>
    );
};

function AppRoutes() {
    const { isAdmin } = useUser();
    const navigate = useNavigate();

    // This effect handles the initial redirect for the access_denied error
    useEffect(() => {
        const params = new URLSearchParams(window.location.hash.substring(1));
        if (params.has('error_description')) {
            navigate('/access-denied');
        }
    }, [navigate]);

    return (
        <Routes>
            {/* Public routes that don't need a layout */}
            <Route path="/" element={<AuthForm />} />
            <Route path="/setup" element={<AccountSetup />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/access-denied" element={<AccessDenied />} />

            {/* --- THE FIX: All protected routes are now nested here --- */}
            <Route element={<ProtectedRoute />}>
                <Route path="/events" element={<Events />} />
                <Route path="/mysignups" element={<MySignups />} />
                {isAdmin && <Route path="/admin" element={<AdminPage />} />}
            </Route>

            {/* A catch-all route to redirect any other path (like /dashboard) to the events page */}
            <Route path="*" element={<Navigate to="/events" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <CssBaseline />
            <UserProvider>
                <Suspense fallback={
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                        <CircularProgress />
                    </Box>
                }>
                    <AppRoutes />
                </Suspense>
            </UserProvider>
        </Router>
    );
}

export default App;