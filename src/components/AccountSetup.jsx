import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Container, TextField, Button, Typography, Box, Alert, Select, MenuItem, FormControl, InputLabel, Paper, Divider } from '@mui/material';

function AccountSetup() {
    const [name, setName] = useState("");
    const [studentNumber, setStudentNumber] = useState("");
    const [studentNumberError, setStudentNumberError] = useState("");
    const [role, setRole] = useState("");
    const [carSpaces, setCarSpaces] = useState("");
    const [emergencyContactName, setEmergencyContactName] = useState("");
    const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
    const [medicalNotes, setMedicalNotes] = useState("");
    const [apiError, setApiError] = useState(null);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

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
                    setName(profile.name || "");
                    setRole(profile.role || "");
                    setStudentNumber(profile.student_number || "");
                    setEmergencyContactName(profile.emergency_contact_name || "");
                    setEmergencyContactPhone(profile.emergency_contact_phone || "");
                    setMedicalNotes(profile.medical_notes || "");

                    if (!profile.student_number) {
                        setMessage("Your profile is incomplete. Please complete your profile details to continue.");
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
                student_number: studentNumber,
                emergency_contact_name: emergencyContactName,
                emergency_contact_phone: emergencyContactPhone,
                medical_notes: medicalNotes
            });

        if (upsertError) {
            setApiError(upsertError.message);
            return;
        }

        if (role === "Driver") {
            const { error: driverError } = await supabase
                .from("cars")
                .upsert({ driver_id: user.id, car_spaces: parseInt(carSpaces) || 1 }, { onConflict: 'driver_id' });

            if (driverError) {
                setApiError(driverError.message);
                return;
            }
        }

        await supabase.auth.updateUser({
            data: { setup_complete: true }
        });

        navigate("/events");
    };

    return (
        <Container maxWidth="sm" sx={{ py: 6, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Paper elevation={4} sx={{ p: 4, borderRadius: 3, width: '100%' }}>
                <Typography variant="h4" fontWeight="bold" align="center" gutterBottom color="primary">
                    Account Profile Setup
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
                    Please enter your membership, emergency contact, and safety information.
                </Typography>

                {message && !apiError && <Alert severity="info" sx={{ mb: 3 }}>{message}</Alert>}
                {apiError && <Alert severity="error" sx={{ mb: 3 }}>{apiError}</Alert>}

                <form onSubmit={handleSetupComplete}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
                        1. General Details
                    </Typography>
                    <TextField fullWidth label="Full Name" required margin="dense" value={name} onChange={(e) => setName(e.target.value)} />
                    <TextField
                        fullWidth
                        label="7-Digit Student Number"
                        required
                        margin="dense"
                        value={studentNumber}
                        onChange={(e) => setStudentNumber(e.target.value)}
                        error={!!studentNumberError}
                        helperText={studentNumberError}
                    />
                    <FormControl fullWidth required margin="dense">
                        <InputLabel>Are you a driver?</InputLabel>
                        <Select value={role} label="Are you a driver?" onChange={(e) => setRole(e.target.value)}>
                            <MenuItem value="Driver">Yes, I can drive</MenuItem>
                            <MenuItem value="Member">No, I'm a passenger</MenuItem>
                        </Select>
                    </FormControl>
                    {role === "Driver" && (
                        <TextField
                            fullWidth
                            label="Total car seats (including driver)"
                            type="number"
                            required
                            margin="dense"
                            value={carSpaces}
                            onChange={(e) => setCarSpaces(e.target.value)}
                            inputProps={{ min: 1 }}
                        />
                    )}

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                        2. Safety & Emergency Contacts
                    </Typography>
                    <TextField
                        fullWidth
                        label="Emergency Contact Name"
                        required
                        margin="dense"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        label="Emergency Contact Phone Number"
                        required
                        margin="dense"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        label="Medical Notes / Allergies / Dietary Needs"
                        multiline
                        rows={2}
                        margin="dense"
                        placeholder="e.g. Asthma, Peanut Allergy, Vegetarian, None"
                        value={medicalNotes}
                        onChange={(e) => setMedicalNotes(e.target.value)}
                    />

                    <Button fullWidth variant="contained" type="submit" size="large" sx={{ mt: 4, py: 1.5, borderRadius: 2 }}>
                        Save & Complete Setup
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}

export default AccountSetup;