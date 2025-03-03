import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

function Layout({ children }) {
    const navigate = useNavigate();

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw" }}>
            {/* Top Navigation Bar */}
            <AppBar position="static" sx={{ bgcolor: "white", boxShadow: "none", borderBottom: "1px solid #ddd", padding: "10px 20px" }}>
                <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

                    {/* Logo - Clickable to Home */}
                    <Box
                        component="img"
                        src="https://assets.zyrosite.com/m5KbJakbLpivbpzd/ai-logo-A1aJq39wW9HGqzvO.svg"
                        alt="Brunel Sailing logo"
                        sx={{ height: "40px", cursor: "pointer" }}
                        onClick={() => navigate("/")}
                    />

                    {/* Navigation Buttons */}
                    <Box sx={{ display: "flex", gap: 2, borderRadius: 0 }}>
                        {["Dashboard", "MySignups"].map((label) => (
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
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center", mt: 1, width: "100%" }}>
                {children}
            </Box>
        </Box>
    );
}

export default Layout;
