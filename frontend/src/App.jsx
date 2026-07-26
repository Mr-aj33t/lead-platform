import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import PublicLayout from './layouts/PublicLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Landing from './pages/Landing.jsx';
import LeadCapture from './pages/LeadCapture.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leads from './pages/Leads.jsx';
import LeadDetail from './pages/LeadDetail.jsx';
import NewLead from './pages/NewLead.jsx';
import ActivityLog from './pages/ActivityLog.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/register-form" element={<LeadCapture />} />
          <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/new" element={<NewLead />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/activity" element={<ActivityLog />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
