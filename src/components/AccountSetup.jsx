import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Container, TextField, Button, Typography, Box, Alert, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

function AccountSetup() {
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [carSpaces, setCarSpaces] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSetupComplete = async (e) => {
        e.preventDefault();
        setError(null);

        // Get authenticated user
        const { data: user, error: userError } = await supabase.auth.getUser();
        if (userError || !user || !user.user) {
            setError("Error fetching authenticated user.");
            return;
        }

        const userId = user.user.id;
        const email = user.user.email;

        // Insert user into `users` table
        const { error: insertError } = await supabase
            .from("users")
            .insert([{ id: userId, name, email, role}]);

        if (insertError) {
            setError(insertError.message);
            return;
        }

        // If driver, insert into `drivers` table
        if (role === "Driver") {
            const { error: driverError } = await supabase
                .from("cars")
                .insert([{ driver_id: userId, car_spaces: parseInt(carSpaces) }]);

            if (driverError) {
                setError(driverError.message);
                return;
            }
        }

        const { error: updateError } = await supabase.auth.updateUser({
            data: { setup_complete: true }
        });

        // Navigate to dashboard after successful setup
        navigate("/dashboard");
    };

    return (
        <Container maxWidth="false" sx={{ width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Box sx={{ textAlign: "center", mt: 5, width: "40vw" }}>
                <Typography variant="h4">Account Setup</Typography>
                {error && <Alert severity="error">{error}</Alert>}

                <form onSubmit={handleSetupComplete}>
                    <TextField fullWidth label="Full Name" required margin="normal" value={name} onChange={(e) => setName(e.target.value)} />
                    <FormControl fullWidth required margin="normal">
                        <InputLabel>Do you drive?</InputLabel>
                        <Select value={role} onChange={(e) => setRole(e.target.value)}>
                            <MenuItem value="Driver">Driver</MenuItem>
                            <MenuItem value="Member">Non-Driver</MenuItem>
                        </Select>
                    </FormControl>

                    {role === "Driver" && (
                        <TextField
                            fullWidth
                            label="How many spaces does your car have?"
                            type="number"
                            variant="outlined"
                            margin="normal"
                            value={carSpaces}
                            onChange={(e) => setCarSpaces(e.target.value)}
                            inputProps={{ min: 1 }}
                        />
                    )}

                    <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }}>Complete Setup</Button>
                </form>
            </Box>
        </Container>
    );
}

export default AccountSetup;