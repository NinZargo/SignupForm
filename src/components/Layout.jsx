import { useState } from "react";
import { AppBar, Toolbar, Button, Box, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, Paper } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";
import { useUser } from '../contexts/UserContext';

function Layout({ children }) {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { isAdmin } = useUser();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const baseNavItems = ["Events", "MySignups"];
    const navItems = isAdmin ? [...baseNavItems, "Admin"] : baseNavItems;

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
            <List>
                {navItems.map((item) => (
                    <ListItem key={item} disablePadding>
                        <ListItemButton sx={{ textAlign: 'center' }} onClick={() => navigate(`/${item.toLowerCase()}`)}>
                            <ListItemText primary={item} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        // The root Box now has the subtle pattern background
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
                    <Box component="img" src="https://assets.zyrosite.com/m5KbJakbLpivbpzd/ai-logo-A1aJq39wW9HGqzvO.svg" alt="Brunel Sailing logo" sx={{ height: "40px", cursor: "pointer" }} onClick={() => navigate("/")} />
                    <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 2 }}>
                        {navItems.map((label) => (
                            <Button key={label} sx={{ color: "black", textTransform: "none" }} onClick={() => navigate(`/${label.toLowerCase()}`)}>
                                {label}
                            </Button>
                        ))}
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
                        backgroundColor: 'white', // Changed to solid white for better contrast
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