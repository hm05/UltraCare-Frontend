import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';

// Public Pages
import Home from './pages/public/Home';
import AboutUs from './pages/public/AboutUs';
import ContactUs from './pages/public/ContactUs';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SetupOrganization from './pages/auth/SetupOrganization';

// App Pages
import DoctorDashboard from './pages/Dashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import SearchCase from './pages/app/SearchCase';
import CreateCase from './pages/app/CreateCase';
import CollectionData from './pages/app/CollectionData';
import ReferralData from './pages/app/ReferralData';
import OrgSettings from './pages/app/OrgSettings';
import CaseDetail from './pages/app/CaseDetail';
import ReferralDoctorDetail from './pages/app/ReferralDoctorDetail';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="loader"></div></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function DoctorOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role === 'staff') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'staff') return <StaffDashboard />;
  return <DoctorDashboard />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact-us" element={<ContactUs />} />
        </Route>

        {/* Auth Routes (no layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/setup-organization" element={<ProtectedRoute><SetupOrganization /></ProtectedRoute>} />

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/search" element={<SearchCase />} />
          <Route path="/create-case" element={<CreateCase />} />
          <Route path="/case/:caseId" element={<CaseDetail />} />
          {/* Doctor-only routes */}
          <Route path="/collection" element={<DoctorOnlyRoute><CollectionData /></DoctorOnlyRoute>} />
          <Route path="/referrals" element={<DoctorOnlyRoute><ReferralData /></DoctorOnlyRoute>} />
          <Route path="/referral/:doctorId" element={<DoctorOnlyRoute><ReferralDoctorDetail /></DoctorOnlyRoute>} />
          <Route path="/settings" element={<DoctorOnlyRoute><OrgSettings /></DoctorOnlyRoute>} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
