import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield, FileText, Search, LayoutDashboard, LogIn, LogOut,
  Bell, Menu, X, User, HelpCircle, Home, ChevronDown
} from 'lucide-react';
import { getAuthUser, getAuthToken } from '../App.jsx';

const API = 'http://localhost:5000/api';

function getSessionToken() {
  let t = localStorage.getItem('kcet_session');
  if (!t) { t = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`; localStorage.setItem('kcet_session', t); }
  return t;
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getAuthUser();
  const token = getAuthToken();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unread, setUnread] = useState(0);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Scroll detection for navbar shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    async function fetchUnread() {
      try {
        const sessionToken = getSessionToken();
        const params = user && token ? '' : `?sessionToken=${sessionToken}`;
        const headers = user && token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API}/notifications${params}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setUnread(data.unread || 0);
        }
      } catch {}
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [user, token]);

  function logout() {
    localStorage.removeItem('kcet_token');
    localStorage.removeItem('kcet_user');
    navigate('/');
    window.location.reload();
  }

  const isStaff = user && ['staff', 'admin', 'grievance_officer'].includes(user.role);
  const isAdmin = user && ['admin', 'grievance_officer'].includes(user.role);
  const isStudent = user && user.role === 'student';

  const navLinks = [
    { to: '/submit', icon: <FileText size={14} />, label: 'Submit' },
    { to: '/track', icon: <Search size={14} />, label: 'Track' },
    { to: '/safety', icon: <Shield size={14} />, label: 'Safety', className: 'navbar__link--safety' },
  ];

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="navbar__inner">
          {/* Brand */}
          <Link to="/" className="navbar__brand">
            <div className="navbar__logo-mark">🛡️</div>
            <span className="navbar__logo">KCET SmartGrievance</span>
            <span className="navbar__badge">v2.0</span>
          </Link>

          {/* Desktop links */}
          <div className="navbar__links">
            {navLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `navbar__link${l.className ? ` ${l.className}` : ''}${isActive ? ' active' : ''}`
                }
              >
                {l.icon} {l.label}
              </NavLink>
            ))}

            {/* Auth-specific links */}
            {token && user ? (
              <>
                {isStudent && (
                  <NavLink to="/my-complaints" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>
                    <LayoutDashboard size={14} /> Dashboard
                  </NavLink>
                )}
                {isStaff && (
                  <NavLink to="/staff" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>
                    <LayoutDashboard size={14} /> Staff
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>
                    Admin
                  </NavLink>
                )}

                {/* Notification bell */}
                <NavLink to="/notifications" className="navbar__bell" title="Notifications">
                  <Bell size={18} />
                  {unread > 0 && (
                    <span className="navbar__notif-badge">{unread > 9 ? '9+' : unread}</span>
                  )}
                </NavLink>

                {/* Avatar → profile */}
                <NavLink to="/profile" className="navbar__avatar" title={`${user.name} · ${user.role}`}>
                  {initials(user.name)}
                </NavLink>

                <button className="navbar__link" onClick={logout} title="Sign out" style={{ gap: 6, fontSize: 13 }}>
                  <LogOut size={14} /> Out
                </button>
              </>
            ) : (
              <>
                {/* Notification bell for anonymous */}
                <NavLink to="/notifications" className="navbar__bell" title="Notifications">
                  <Bell size={18} />
                  {unread > 0 && (
                    <span className="navbar__notif-badge">{unread > 9 ? '9+' : unread}</span>
                  )}
                </NavLink>
                <NavLink to="/student-login" className={({ isActive }) => `navbar__link navbar__link--cta${isActive ? ' active' : ''}`}>
                  <LogIn size={14} /> Student Login
                </NavLink>
              </>
            )}

            {/* Hamburger */}
            <button
              className="navbar__hamburger"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`navbar__mobile-drawer${mobileOpen ? ' open' : ''}`}>
        <NavLink to="/" className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`}>
          <Home size={18} /> Home
        </NavLink>
        <NavLink to="/submit" className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`}>
          <FileText size={18} /> Submit Complaint
        </NavLink>
        <NavLink to="/track" className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`}>
          <Search size={18} /> Track Complaint
        </NavLink>
        <NavLink to="/safety" className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`} style={{ color: 'var(--safety)' }}>
          <Shield size={18} /> Safety Report
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`}>
          <Bell size={18} /> Notifications {unread > 0 && `(${unread})`}
        </NavLink>
        <NavLink to="/help" className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`}>
          <HelpCircle size={18} /> Help & Support
        </NavLink>

        <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

        {token && user ? (
          <>
            <NavLink to="/profile" className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`}>
              <User size={18} /> My Profile
            </NavLink>
            {isStudent && (
              <NavLink to="/my-complaints" className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`}>
                <LayoutDashboard size={18} /> My Complaints
              </NavLink>
            )}
            {isStaff && (
              <NavLink to="/staff" className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`}>
                <LayoutDashboard size={18} /> Staff Dashboard
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`}>
                <LayoutDashboard size={18} /> Admin Panel
              </NavLink>
            )}
            <button
              onClick={logout}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'var(--safety-dim)', border: '1px solid var(--safety-border)', borderRadius: 'var(--radius-sm)', color: 'var(--safety)', fontSize: 15, fontWeight: 500, cursor: 'pointer', width: '100%' }}
            >
              <LogOut size={18} /> Sign Out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/student-login" className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`}>
              <LogIn size={18} /> Student Login / Register
            </NavLink>
            <NavLink to="/login" className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`}>
              <User size={18} /> Staff Login
            </NavLink>
          </>
        )}
      </div>
    </>
  );
}
