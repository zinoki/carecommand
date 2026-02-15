import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Landing } from './pages/Landing';
import { Pricing } from './pages/Pricing';
import { Signup } from './pages/Signup';
import { Login } from './pages/Login';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Caregivers } from './pages/Caregivers';
import { CaregiverProfile } from './pages/CaregiverProfile';
import { Clients } from './pages/Clients';
import { ClientProfile } from './pages/ClientProfile';
import { Leads } from './pages/Leads';
import { LeadProfile } from './pages/LeadProfile';
import { AddLead } from './pages/AddLead';
import { Applicants } from './pages/Applicants';
import { ApplicantProfile } from './pages/ApplicantProfile';
import { Recruiting } from './pages/Recruiting';
import { AddCandidate } from './pages/AddCandidate';
import { CandidateProfile } from './pages/CandidateProfile';
import { Onboarding } from './pages/Onboarding';
import { Compliance } from './pages/Compliance';
import { Tasks } from './pages/Tasks';
import { Reports } from './pages/Reports';
import { ProfileSettings } from './pages/ProfileSettings';
import { OrganizationSettings } from './pages/OrganizationSettings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="recruiting" element={<Recruiting />} />
        <Route path="recruiting/new" element={<AddCandidate />} />
        <Route path="recruiting/:id" element={<CandidateProfile />} />
        <Route path="onboarding/:id" element={<Onboarding />} />
        <Route path="caregivers" element={<Caregivers />} />
        <Route path="caregivers/:id" element={<CaregiverProfile />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientProfile />} />
        <Route path="leads" element={<Leads />} />
        <Route path="leads/new" element={<AddLead />} />
        <Route path="leads/:id" element={<LeadProfile />} />
        <Route path="applicants" element={<Applicants />} />
        <Route path="applicants/:id" element={<ApplicantProfile />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings/profile" element={<ProfileSettings />} />
        <Route path="settings/organization" element={<OrganizationSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
