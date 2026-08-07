import { useEffect, lazy, Suspense } from 'react';
import { HashRouter as Router, Route, Routes, useNavigate, Navigate, Outlet } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { UserProvider, useUser } from './contexts/UserContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import Layout from "./components/Layout";
import AuthForm from "./components/AuthForm";

const AccountSetup = lazy(() => import('./components/AccountSetup'));
const Events = lazy(() => import('./components/EventList.jsx'));
const MySignups = lazy(() => import('./components/MySignups'));
const UpdatePassword = lazy(() => import('./components/ResetPassword'));
const AccessDenied = lazy(() => import('./components/AccessDenied'));
const AdminPage = lazy(() => import('./components/AdminPage'));

const ProtectedRoute = () => {
    const { session, profile, loading } = useUser();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!session) {
        return <Navigate to="/" replace />;
    }

    if (!profile?.name) {
        return <Navigate to="/setup" replace />;
    }

    return (
        <Layout>
            <Outlet />
        </Layout>
    );
};

function AppRoutes() {
    const { isAdmin } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.hash.substring(1));
        if (params.has('error_description')) {
            navigate('/access-denied');
        }
    }, [navigate]);

    return (
        <Routes>
            <Route path="/" element={<AuthForm />} />
            <Route path="/setup" element={<AccountSetup />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/access-denied" element={<AccessDenied />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/events" element={<Events />} />
                <Route path="/mysignups" element={<MySignups />} />
                {isAdmin && <Route path="/admin" element={<AdminPage />} />}
            </Route>

            <Route path="*" element={<Navigate to="/events" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <CustomThemeProvider>
            <Router>
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
        </CustomThemeProvider>
    );
}

export default App;