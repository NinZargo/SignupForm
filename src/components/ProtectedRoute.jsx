import { useUser } from '../contexts/UserContext'; // 1. Import useUser
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

function ProtectedRoute({ children }) {
    // 2. Get isAdmin and loading state directly from the context
    const { isAdmin, loading } = useUser();

    // 3. The local state and useEffect have been removed.

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return isAdmin ? children : <Navigate to="/dashboard" replace />;
}

export default ProtectedRoute;