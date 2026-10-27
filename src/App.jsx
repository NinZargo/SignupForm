import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { UserProvider, useUser } from './contexts/UserContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import AuthForm from './components/AuthForm';

const AccountSetup   = lazy(() => import('./components/AccountSetup'));
const Events         = lazy(() => import('./components/EventList.jsx'));
const MySignups      = lazy(() => import('./components/MySignups'));
const UpdatePassword = lazy(() => import('./components/ResetPassword'));
const AccessDenied   = lazy(() => import('./components/AccessDenied'));
const AdminPage      = lazy(() => import('./components/AdminPage'));
const DatchetPage    = lazy(() => import('./components/DatchetPage'));

const Spinner = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
    </Box>
);

const ProtectedRoute = () => {
    const { session, profile, loading, recoveryMode } = useUser();

    if (loading) return <Spinner />;

    // Always let recovery flow through
    if (recoveryMode) return <Navigate to="/update-password" replace />;

    if (!session) return <Navigate to="/" replace />;

    if (!profile?.name || !profile?.student_number || !profile?.medical_notes || profile.medical_notes.trim() === '') {
        return <Navigate to="/setup" replace />;
    }

    return <Layout><Outlet /></Layout>;
};

function AppRoutes() {
    const { isAdmin, recoveryMode } = useUser();
    const navigate = useNavigate();

    // Navigate to reset page as soon as recoveryMode is set.
    // This runs after mount so navigate() is always available.
    useEffect(() => {
        if (recoveryMode) {
            navigate('/update-password', { replace: true });
        }
    }, [recoveryMode, navigate]);

    return (
        <Routes>
            {/* Public */}
            <Route path="/"                element={<AuthForm />} />
            <Route path="/setup"           element={<AccountSetup />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/access-denied"   element={<AccessDenied />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
                <Route path="/events"    element={<Events />} />
                <Route path="/mysignups" element={<MySignups />} />
                <Route path="/datchet"   element={<DatchetPage />} />
                {isAdmin && <Route path="/admin" element={<AdminPage />} />}
            </Route>

            <Route path="*" element={<Navigate to="/events" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <CustomThemeProvider>
            <Router>
                <UserProvider>
                    <Suspense fallback={<Spinner />}>
                        <AppRoutes />
                    </Suspense>
                </UserProvider>
            </Router>
        </CustomThemeProvider>
    );
}