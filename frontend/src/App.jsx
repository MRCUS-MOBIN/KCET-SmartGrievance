import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar             from './components/Navbar.jsx';
import LandingPage        from './pages/LandingPage.jsx';
import SubmitComplaint    from './pages/SubmitComplaint.jsx';
import TrackComplaint     from './pages/TrackComplaint.jsx';
import StudentDashboard   from './pages/StudentDashboard.jsx';
import StaffDashboard     from './pages/StaffDashboard.jsx';
import DepartmentDashboard from './pages/DepartmentDashboard.jsx';
import AdminDashboard     from './pages/AdminDashboard.jsx';
import LoginPage          from './pages/LoginPage.jsx';
import StudentLogin       from './pages/StudentLogin.jsx';
import SafetyReport       from './pages/SafetyReport.jsx';
import NotificationCenter from './pages/NotificationCenter.jsx';
import ProfilePage        from './pages/ProfilePage.jsx';
import HelpSupport        from './pages/HelpSupport.jsx';
import PrivacyPolicy      from './pages/PrivacyPolicy.jsx';

// ── Auth helpers ──────────────────────────────────────────────────────────────
export function getAuthUser() {
  try { return JSON.parse(localStorage.getItem('kcet_user') || 'null'); } catch { return null; }
}
export function getAuthToken() {
  return localStorage.getItem('kcet_token') || null;
}

function ProtectedRoute({ children, roles }) {
  const user = getAuthUser();
  const token = getAuthToken();
  if (!user || !token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <div className="page-wrap">
      <Navbar />
      <Routes>
        {/* Public pages */}
        <Route path="/"               element={<LandingPage />} />
        <Route path="/submit"         element={<SubmitComplaint />} />
        <Route path="/track"          element={<TrackComplaint />} />
        <Route path="/safety"         element={<SafetyReport />} />
        <Route path="/notifications"  element={<NotificationCenter />} />
        <Route path="/help"           element={<HelpSupport />} />
        <Route path="/privacy"        element={<PrivacyPolicy />} />

        {/* Auth pages */}
        <Route path="/student-login"  element={<StudentLogin />} />
        <Route path="/login"          element={<LoginPage />} />

        {/* Student pages (no strict auth gate — uses localStorage) */}
        <Route path="/my-complaints"  element={<StudentDashboard />} />
        <Route path="/profile"        element={<ProfilePage />} />

        {/* Staff dashboard — regular staff → DepartmentDashboard, admin/GO → StaffDashboard */}
        <Route path="/staff" element={
          <ProtectedRoute roles={['staff', 'admin', 'grievance_officer']}>
            {(() => {
              const u = getAuthUser();
              return u?.role === 'staff'
                ? <DepartmentDashboard />
                : <StaffDashboard />;
            })()}
          </ProtectedRoute>
        } />

        {/* Admin dashboard */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin', 'grievance_officer']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
