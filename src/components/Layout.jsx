import { useState } from "react";
import {
    AppBar,
    Toolbar,
    Button,
    Box,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Divider,
    Stack,
    Paper,
    Typography,
    Tooltip,
    useTheme
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from '../contexts/UserContext';
import { useColorMode } from '../contexts/ThemeContext';
import InstallAppButton from "./InstallAppButton";

function Layout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { isAdmin } = useUser();
    const { toggleColorMode } = useColorMode();
    const theme = useTheme();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const baseNavItems = [
        { label: 'Events', path: '/events' },
        { label: 'My Signups', path: '/mysignups' },
        { label: 'Datchet', path: '/datchet' }
    ];
    const navItems = isAdmin ? [...baseNavItems, { label: 'Admin', path: '/admin' }] : baseNavItems;

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
            <List>
                {navItems.map((item) => (
                    <ListItem key={item.label} disablePadding>
                        <ListItemButton sx={{ textAlign: 'center' }} onClick={() => navigate(item.path)}>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
                <Divider />
                <ListItem disablePadding>
                    <ListItemButton sx={{ textAlign: 'center' }} onClick={toggleColorMode}>
                        <ListItemText primary={theme.palette.mode === 'dark' ? 'Light Mode' : 'Dark Mode'} />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton sx={{ textAlign: 'center' }} onClick={handleLogout}>
                        <ListItemText primary="Logout" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            width: '100vw',
            backgroundColor: theme.palette.mode === 'light' ? '#f4f6f8' : '#0b132b',
            backgroundImage: theme.palette.mode === 'light'
                ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='%23dce4ec' fill-opacity='1'%3E%3Cpolygon fill-rule='evenodd' points='8 4 12 6 8 8 6 12 4 8 0 6 4 4 6 0 8 4'/%3E%3C/g%3E%3C/svg%3E")`
                : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='%231c2541' fill-opacity='0.6'%3E%3Cpolygon fill-rule='evenodd' points='8 4 12 6 8 8 6 12 4 8 0 6 4 4 6 0 8 4'/%3E%3C/g%3E%3C/svg%3E")`,
        }}>
            <AppBar position="static" color="default" sx={{ boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
                <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: { xs: "10px", sm: "10px 20px" } }}>
                    <Box
                        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1.5 }}
                        onClick={() => navigate("/events")}
                    >
                        <Box
                            component="img"
                            src="/BrunelSailingIcon.jpeg"
                            alt="Brunel Sailing logo"
                            sx={{ height: "40px", borderRadius: 1 }}
                        />
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{
                                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                                fontWeight: 800,
                                fontSize: '1.8rem',
                                letterSpacing: -0.5,
                                color: theme.palette.mode === 'dark' ? '#90caf9' : '#0d47a1',
                                display: { xs: 'none', sm: 'block' }
                            }}
                        >
                            Brunel Sailing
                        </Typography>
                    </Box>

                    <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: 'center', gap: 1 }}>
                        <Stack direction="row" spacing={1} divider={<Divider orientation="vertical" flexItem sx={{ height: '20px', alignSelf: 'center' }} />}>
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Button
                                        key={item.label}
                                        onClick={() => navigate(item.path)}
                                        sx={{
                                            color: isActive ? 'primary.main' : 'text.primary',
                                            fontWeight: isActive ? 'bold' : 'normal',
                                            backgroundColor: isActive ? 'action.selected' : 'transparent',
                                            textTransform: "none",
                                            borderRadius: 2,
                                            px: 2,
                                            '&:hover': {
                                                backgroundColor: 'action.hover'
                                            }
                                        }}
                                    >
                                        {item.label}
                                    </Button>
                                );
                            })}
                        </Stack>

                        <InstallAppButton />

                        <Tooltip title={theme.palette.mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                            <IconButton onClick={toggleColorMode} color="inherit" sx={{ ml: 0.5 }}>
                                {theme.palette.mode === 'dark' ? <Brightness7Icon color="warning" /> : <Brightness4Icon />}
                            </IconButton>
                        </Tooltip>

                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleLogout}
                            sx={{ textTransform: 'none', ml: 1, borderRadius: 2 }}
                        >
                            Logout
                        </Button>
                    </Box>

                    <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center' }}>
                        <IconButton onClick={toggleColorMode} color="inherit">
                            {theme.palette.mode === 'dark' ? <Brightness7Icon color="warning" /> : <Brightness4Icon />}
                        </IconButton>
                        <IconButton color="inherit" aria-label="open drawer" edge="end" onClick={handleDrawerToggle}>
                            <MenuIcon />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: "block", sm: "none" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: "60%" } }}>
                {drawer}
            </Drawer>

            <Box component="main" sx={{
                flexGrow: 1,
                p: { xs: 2, sm: 3 },
                width: "100%",
                display: 'flex',
                justifyContent: 'center'
            }}>
                <Paper
                    elevation={2}
                    sx={{
                        width: '100%',
                        maxWidth: '1200px',
                        borderRadius: 3,
                        p: { xs: 2, sm: 4 },
                    }}
                >
                    {children}
                </Paper>
            </Box>
        </Box>
    );
}

export default Layout;