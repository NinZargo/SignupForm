import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Container, TextField, Button, Typography, Box, Alert, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

function AccountSetup() {
    const [name, setName] = useState("");
    const [studentNumber, setStudentNumber] = useState("");
    const [studentNumberError, setStudentNumberError] = useState("");
    const [role, setRole] = useState("");
    const [carSpaces, setCarSpaces] = useState("");
    const [apiError, setApiError] = useState(null);
    const [message, setMessage] = useState(""); // State for the instructional message
    const navigate = useNavigate();

    // 1. Add a useEffect to fetch the user's current profile data on load
    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    // Pre-fill the form with any existing data
                    setName(profile.name || "");
                    setRole(profile.role || "");
                    setStudentNumber(profile.student_number || "");

                    // 2. Set the instructional message if the student number is missing
                    if (!profile.student_number) {
                        setMessage("Your profile is incomplete. Please add your student number to continue.");
                    }
                }
            }
        }
        loadProfile();
    }, []);

    const validateStudentNumber = () => {
        if (!/^\d{7}$/.test(studentNumber)) {
            setStudentNumberError("Student number must be exactly 7 digits.");
            return false;
        }
        const currentYearLastTwoDigits = new Date().getFullYear() % 100;
        const studentYear = parseInt(studentNumber.substring(0, 2), 10);
        if (studentYear > currentYearLastTwoDigits) {
            setStudentNumberError(`The year prefix '${studentNumber.substring(0, 2)}' cannot be in the future.`);
            return false;
        }
        setStudentNumberError("");
        return true;
    };

    const handleSetupComplete = async (e) => {
        e.preventDefault();
        setApiError(null);

        if (!validateStudentNumber()) {
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setApiError("Error fetching authenticated user.");
            return;
        }

        const { error: upsertError } = await supabase
            .from("users")
            .upsert({
                id: user.id,
                name,
                email: user.email,
                role,
                student_number: studentNumber
            });

        if (upsertError) {
            setApiError(upsertError.message);
            return;
        }

        if (role === "Driver") {
            const { error: driverError } = await supabase
                .from("cars")
                .upsert({ driver_id: user.id, car_spaces: parseInt(carSpaces) }, { onConflict: 'driver_id' });

            if (driverError) {
                setApiError(driverError.message);
                return;
            }
        }

        await supabase.auth.updateUser({
            data: { setup_complete: true }
        });

        navigate("/dashboard");
    };

    return (
        <Container maxWidth="false" sx={{ width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Box sx={{ p: 3, boxShadow: 3, borderRadius: 2, textAlign: 'center', maxWidth: 400, width: '100%' }}>
                <Typography variant="h4" gutterBottom>Account Setup</Typography>
                {/* 3. Display the instructional message or API errors */}
                {message && !apiError && <Alert severity="info" sx={{ my: 2 }}>{message}</Alert>}
                {apiError && <Alert severity="error" sx={{ my: 2 }}>{apiError}</Alert>}

                <form onSubmit={handleSetupComplete}>
                    <TextField fullWidth label="Full Name" required margin="normal" value={name} onChange={(e) => setName(e.target.value)} />
                    <TextField
                        fullWidth
                        label="Student Number"
                        required
                        margin="normal"
                        value={studentNumber}
                        onChange={(e) => setStudentNumber(e.target.value)}
                        error={!!studentNumberError}
                        helperText={studentNumberError}
                    />
                    <FormControl fullWidth required margin="normal">
                        <InputLabel>Are you a driver?</InputLabel>
                        <Select value={role} onChange={(e) => setRole(e.target.value)}>
                            <MenuItem value="Driver">Yes, I can drive</MenuItem>
                            <MenuItem value="Member">No, I'm a passenger</MenuItem>
                        </Select>
                    </FormControl>
                    {role === "Driver" && (
                        <TextField
                            fullWidth
                            label="How many seats does your car have (including you)?"
                            type="number"
                            required
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