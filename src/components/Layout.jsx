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
    Paper
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from '../contexts/UserContext';
import { supabase } from "../supabaseClient";

function Layout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { isAdmin } = useUser();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Use an array of objects for clearer navigation paths
    const baseNavItems = [
        { label: 'Events', path: '/events' },
        { label: 'MySignups', path: '/mysignups' }
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
            backgroundColor: '#f4f6f8',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='%23dce4ec' fill-opacity='1'%3E%3Cpolygon fill-rule='evenodd' points='8 4 12 6 8 8 6 12 4 8 0 6 4 4 6 0 8 4'/%3E%3C/g%3E%3C/svg%3E")`,
        }}>
            <AppBar position="static" sx={{ bgcolor: "white", boxShadow: "none", borderBottom: "1px solid #ddd" }}>
                <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: { xs: "10px", sm: "10px 20px" } }}>
                    <Box component="img" src="https://assets.zyrosite.com/m5KbJakbLpivbpzd/ai-logo-A1aJq39wW9HGqzvO.svg" alt="Brunel Sailing logo" sx={{ height: "40px", cursor: "pointer" }} onClick={() => navigate("/events")} />
                    <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: 'center', gap: 1 }}>
                        <Stack direction="row" spacing={1} divider={<Divider orientation="vertical" flexItem sx={{ height: '20px', alignSelf: 'center' }} />}>
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Button
                                        key={item.label}
                                        onClick={() => navigate(item.path)}
                                        sx={{
                                            color: isActive ? 'primary.main' : 'black',
                                            fontWeight: isActive ? 'bold' : 'normal',
                                            backgroundColor: isActive ? 'action.hover' : 'transparent',
                                            textTransform: "none",
                                            '&:hover': {
                                                backgroundColor: 'action.hover'
                                            }
                                        }}
                                    >
                                        {item.label}
                                    </Button>
                                )
                            })}
                        </Stack>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleLogout}
                            sx={{ textTransform: 'none', ml: 2 }}
                        >
                            Logout
                        </Button>
                    </Box>
                    <IconButton color="inherit" aria-label="open drawer" edge="end" onClick={handleDrawerToggle} sx={{ display: { sm: "none" }, color: "black" }}>
                        <MenuIcon />
                    </IconButton>
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
                    elevation={3}
                    sx={{
                        width: '100%',
                        maxWidth: '1200px',
                        backgroundColor: 'white',
                        borderRadius: 2,
                        p: 3,
                    }}
                >
                    {children}
                </Paper>
            </Box>
        </Box>
    );
}

export default Layout;