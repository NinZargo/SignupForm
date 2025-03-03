import { useState } from "react";
import { AppBar, Toolbar, Button, Box, IconButton, Drawer, List, ListItem, ListItemText } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";

function Layout({ children }) {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Toggle the mobile menu
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Navigation items
    const navItems = ["Dashboard", "MySignups"];

    // Drawer content for mobile
    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
            <List>
                {navItems.map((item) => (
                    <ListItem
                        key={item}
                        button
                        onClick={() => navigate(`/${item.toLowerCase()}`)}
                        sx={{ textAlign: "center" }}
                    >
                        <ListItemText primary={item} />
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw" }}>
            {/* Top Navigation Bar */}
            <AppBar position="static" sx={{ bgcolor: "white", boxShadow: "none", borderBottom: "1px solid #ddd" }}>
                <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: { xs: "10px", sm: "10px 20px" } }}>

                    {/* Logo - Clickable to Home */}
                    <Box
                        component="img"
                        src="https://assets.zyrosite.com/m5KbJakbLpivbpzd/ai-logo-A1aJq39wW9HGqzvO.svg"
                        alt="Brunel Sailing logo"
                        sx={{ height: "40px", cursor: "pointer" }}
                        onClick={() => navigate("/")}
                    />

                    {/* Navigation Buttons (Hidden on Mobile) */}
                    <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 2 }}>
                        {navItems.map((label) => (
                            <Button
                                key={label}
                                sx={{
                                    color: "black",
                                    textTransform: "none",
                                    borderBottom: "2px solid transparent",
                                    "&:hover": { borderBottom: "2px solid black" }
                                }}
                                onClick={() => navigate(`/${label.toLowerCase()}`)}
                            >
                                {label}
                            </Button>
                        ))}
                    </Box>

                    {/* Hamburger Menu (Visible on Mobile) */}
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

            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }} // Better performance on mobile
                sx={{
                    display: { xs: "block", sm: "none" },
                    "& .MuiDrawer-paper": { boxSizing: "border-box", width: "60%" }
                }}
            >
                {drawer}
            </Drawer>

            {/* Main Content */}
            <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center", mt: 1, width: "100%", padding: { xs: "10px", sm: "20px" } }}>
                {children}
            </Box>
        </Box>
    );
}

export default Layout;