import { useState } from "react";
import { AppBar, Toolbar, Button, Box, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";
// 1. Import the custom useUser hook
import { useUser } from '../contexts/UserContext';

function Layout({ children }) {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    // 2. Get the isAdmin status directly from the context
    const { isAdmin } = useUser();

    // 3. The local useState and useEffect for fetching user data have been removed.

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const baseNavItems = ["Dashboard", "MySignups"];
    // This logic now works instantly without waiting for a data fetch.
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
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100vw" }}>
            <AppBar position="static" sx={{ bgcolor: "white", boxShadow: "none", borderBottom: "1px solid #ddd" }}>
                <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: { xs: "10px", sm: "20px" } }}>
                    <Box
                        component="img"
                        src="https://assets.zyrosite.com/m5KbJakbLpivbpzd/ai-logo-A1aJq39wW9HGqzvO.svg"
                        alt="Brunel Sailing logo"
                        sx={{ height: "40px", cursor: "pointer" }}
                        onClick={() => navigate("/")}
                    />
                    <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 2 }}>
                        {navItems.map((label) => (
                            <Button
                                key={label}
                                sx={{ color: "black", textTransform: "none" }}
                                onClick={() => navigate(`/${label.toLowerCase()}`)}
                            >
                                {label}
                            </Button>
                        ))}
                    </Box>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="end"
                        onClick={handleDrawerToggle}
                        sx={{ display: { sm: "none" }, color: "black" }}
                    >
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: "block", sm: "none" },
                    "& .MuiDrawer-paper": { boxSizing: "border-box", width: "60%" }
                }}
            >
                {drawer}
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, width: "100%" }}>
                {children}
            </Box>
        </Box>
    );
}

export default Layout;