import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { CssBaseline } from "@mui/material";

import Layout from "./components/Layout";
import AuthForm from "./components/AuthForm";
import AccountSetup from "./components/AccountSetup";
import Dashboard from "./components/Dashboard";
import EventSignup from "./components/EventSignup";
import MySignups from "./components/MySignups";

function App() {
    return (
        <Router>
            <CssBaseline />
            <Routes>
                <Route path="/" element={<AuthForm />} />
                <Route path="/setup" element={<AccountSetup />} />
                <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                <Route path="/signup/:eventId" element={<Layout><EventSignup /></Layout>} />
                <Route path="/mysignups" element={<Layout><MySignups /></Layout>} />
            </Routes>
        </Router>
    );
}

export default App;
