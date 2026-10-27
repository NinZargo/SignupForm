import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Container, TextField, Button, Typography, Box, Alert, Select, MenuItem, FormControl, InputLabel, Divider, FormControlLabel, Checkbox, FormHelperText } from '@mui/material';
import fetchUnsplashImage from "./UnsplashImg";
import brunelSailingLogo from "../assets/BrunelSailingIcon.jpeg";
import ImageAttribution from "./ImageAttribution";

import { useUser } from "../contexts/UserContext";

function AccountSetup() {
    const { refreshProfile } = useUser();
    const [name, setName] = useState("");
    const [studentNumber, setStudentNumber] = useState("");
    const [studentNumberError, setStudentNumberError] = useState("");
    const [role, setRole] = useState("");
    const [carSpaces, setCarSpaces] = useState("");
    const [emergencyContactName, setEmergencyContactName] = useState("");
    const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
    const [medicalNotes, setMedicalNotes] = useState("");
    const [gdprConsent, setGdprConsent] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [message, setMessage] = useState("");
    const [backgroundData, setBackgroundData] = useState({ imageUrl: '', photographerName: '', photographerUrl: '' });
    const navigate = useNavigate();

    useEffect(() => {
        async function loadBackgroundImage() {
            const data = await fetchUnsplashImage('sailing race');
            if (data) {
                setBackgroundData(data);
            }
        }
        loadBackgroundImage();
    }, []);

    useEffect(() => {
        async function loadProfile() {
            try {
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
                        if (profile.medical_notes && profile.medical_notes.trim() !== "") {
                            setGdprConsent(true);
                        }

                        // Pre-fill car spaces if user is a driver
                        if (profile.role === "Driver") {
                            const { data: carData } = await supabase
                                .from('cars')
                                .select('car_spaces')
                                .eq('driver_id', user.id)
                                .maybeSingle();

                            if (carData?.car_spaces) {
                                setCarSpaces(carData.car_spaces.toString());
                            }
                        }

                        if (!profile.student_number || !profile.medical_notes || profile.medical_notes.trim() === "") {
                            setMessage("Medical & safety details are required before joining club events. Please complete your profile to continue.");
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading profile:", err);
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

        if (!medicalNotes || medicalNotes.trim() === "") {
            setApiError("Medical information is required. Please provide any medical/dietary notes or type 'None'.");
            return;
        }

        if (!gdprConsent) {
            setApiError("You must consent to data storage for safety & emergency purposes to participate in club activities.");
            return;
        }

        if (role === "Driver") {
            const parsedSpaces = parseInt(carSpaces, 10);
            if (!parsedSpaces || isNaN(parsedSpaces) || parsedSpaces < 1) {
                setApiError("Please enter a valid number of total car seats (at least 1).");
                return;
            }
        }

        try {
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
                    medical_notes: medicalNotes.trim()
                });

            if (upsertError) {
                setApiError(upsertError.message);
                return;
            }

            if (role === "Driver") {
                const spacesCount = parseInt(carSpaces, 10) || 1;
                const { error: driverError } = await supabase
                    .from("cars")
                    .upsert({ driver_id: user.id, car_spaces: spacesCount }, { onConflict: 'driver_id' });

                if (driverError) {
                    setApiError(driverError.message);
                    return;
                }
            }

            if (refreshProfile) {
                await refreshProfile();
            }

            navigate("/events", { replace: true });
        } catch (err) {
            console.error("Setup completion error:", err);
            setApiError("Connection error reaching server. Please check your internet connection or proxy settings and try again.");
        }
    };

    return (
        <Container
            maxWidth={false}
            disableGutters
            sx={{
                width: "100vw",
                minHeight: "100vh",
                position: 'relative',
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 4,
                backgroundImage: backgroundData.imageUrl ? `url(${backgroundData.imageUrl})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                transition: 'background-image 1s ease-in-out'
            }}
        >
            <Box sx={{
                p: 4,
                my: 2,
                boxShadow: 8,
                borderRadius: 3,
                maxWidth: 480,
                width: '92%',
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(28, 37, 65, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                color: 'text.primary',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backdropFilter: 'blur(10px)',
            }}>
                <Box
                    component="img"
                    src={brunelSailingLogo}
                    alt="Brunel Sailing Logo"
                    sx={{ height: 80, width: 80, mb: 2, borderRadius: '50%', boxShadow: 2 }}
                />

                <Typography variant="h4" fontWeight="bold" align="center" gutterBottom color="text.primary">
                    Profile Setup
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
                    Please enter your membership, emergency contact, and safety information.
                </Typography>

                {message && !apiError && <Alert severity="info" sx={{ width: '100%', mb: 3 }}>{message}</Alert>}
                {apiError && <Alert severity="error" sx={{ width: '100%', mb: 3 }}>{apiError}</Alert>}

                <form onSubmit={handleSetupComplete} style={{ width: '100%' }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
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

                    <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
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
                        required
                        multiline
                        rows={2}
                        margin="dense"
                        placeholder="e.g. Asthma, Peanut Allergy, Vegetarian, or 'None'"
                        helperText="Required for safety on water activities. Type 'None' if you have no medical conditions."
                        value={medicalNotes}
                        onChange={(e) => setMedicalNotes(e.target.value)}
                    />

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
                        3. Privacy & Data Protection (GDPR)
                    </Typography>

                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', mb: 2 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={gdprConsent}
                                    onChange={(e) => setGdprConsent(e.target.checked)}
                                    required
                                    color="primary"
                                />
                            }
                            label={
                                <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                                    I consent to <strong>Brunel Sailing Club</strong> storing my emergency contact, dietary, and medical details. I understand this information is stored securely and accessed strictly by authorized club officers for participant safety and emergency response.
                                </Typography>
                            }
                        />
                        <FormHelperText sx={{ ml: 4, mt: 0.5 }}>
                            Data is restricted to club safety officers and used exclusively during club activities.
                        </FormHelperText>
                    </Box>

                    <Button fullWidth variant="contained" color="primary" type="submit" size="large" sx={{ mt: 2, py: 1.2, borderRadius: 2 }}>
                        Save & Complete Setup
                    </Button>
                </form>
            </Box>

            <ImageAttribution
                photographerName={backgroundData.photographerName}
                photographerUrl={backgroundData.photographerUrl}
            />
        </Container>
    );
}

export default AccountSetup;