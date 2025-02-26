import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AuthForm from "./components/AuthForm";
import AccountSetup from "./components/AccountSetup";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<AuthForm />} />
                <Route path="/setup" element={<AccountSetup />} />
                <Route path="/dashboard" element={<h1>Dashboard Placeholder</h1>} />
            </Routes>
        </Router>
    );
}

export default App;

