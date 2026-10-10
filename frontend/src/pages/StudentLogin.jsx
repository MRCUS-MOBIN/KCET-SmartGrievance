import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Shield, GraduationCap, LogIn, UserPlus, ArrowRight } from 'lucide-react';

const API = 'http://localhost:5000/api';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function StudentLogin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  // Login state
  const [identifier, setIdentifier] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [regBranch, setRegBranch] = useState('');
  const [regSemester, setRegSemester] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!identifier.trim() || !loginPass) return toast.error('Enter your email/register number and password.');
    setLoginLoading(true);
    try {
      const res = await fetch(`${API}/auth/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password: loginPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      localStorage.setItem('kcet_token', data.token);
      localStorage.setItem('kcet_user', JSON.stringify(data.user));
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}! 👋`);
      navigate('/my-complaints');
    } catch (err) {
      toast.error(err.message || 'Login failed.');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPass) {
      return toast.error('Name, email, and password are required.');
    }
    if (regPass.length < 8) return toast.error('Password must be at least 8 characters.');
    if (regPass !== regConfirm) return toast.error('Passwords do not match.');
    setRegLoading(true);
    try {
      const res = await fetch(`${API}/auth/student/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPass,
          registerNumber: regNumber.trim(),
          branch: regBranch,
          semester: regSemester || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      localStorage.setItem('kcet_token', data.token);
      localStorage.setItem('kcet_user', JSON.stringify(data.user));
      toast.success(`Account created! Welcome, ${data.user.name.split(' ')[0]}! 🎉`);
      navigate('/my-complaints');
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  }

  const BRANCHES = ['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'IT', 'Chemical', 'Biomedical', 'Other'];

  return (
    <div className="section" style={{ minHeight: '88vh', display: 'flex', alignItems: 'center', padding: '40px 20px' }}>
      <div className="container container--xs">

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }} className="fade-up">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div className="navbar__logo-mark" style={{ width: 48, height: 48, borderRadius: 14, fontSize: 22 }}>🛡️</div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-light), #a0bfff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                KCET SmartGrievance
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Student Portal</div>
            </div>
          </div>
        </div>

        <div className="form-panel form-panel--auth fade-up-1" style={{ maxWidth: 460, margin: '0 auto' }}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', marginBottom: 28 }}>
            {[
              { id: 'login', icon: <LogIn size={14} />, label: 'Sign In' },
              { id: 'register', icon: <UserPlus size={14} />, label: 'Create Account' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: '9px 12px', border: 'none', borderRadius: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  fontSize: 13, fontWeight: 600, transition: 'all var(--transition)',
                  background: tab === t.id ? 'var(--surface2)' : 'transparent',
                  color: tab === t.id ? 'var(--text)' : 'var(--text-3)',
                  boxShadow: tab === t.id ? 'var(--shadow-card)' : 'none',
                }}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <GraduationCap size={36} style={{ color: 'var(--accent-light)', margin: '0 auto 8px' }} />
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Welcome Back</div>
                <div className="text-sm text-muted">Sign in with your email or register number</div>
              </div>

              <div className="form-group">
                <label className="form-label">Email or Register Number</label>
                <input
                  className="form-input"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="email@kcet.ac.in or 21CS001"
                  required autoComplete="username"
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Password</label>
                  <button type="button" style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--accent-light)', cursor: 'pointer' }}>
                    Forgot password?
                  </button>
                </div>
                <div className="password-field">
                  <input
                    className="form-input"
                    type={showLoginPass ? 'text' : 'password'}
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    placeholder="••••••••"
                    required autoComplete="current-password" minLength={8}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowLoginPass(v => !v)}>
                    {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn--primary btn--full" disabled={loginLoading} style={{ marginTop: 4 }}>
                <LogIn size={16} /> {loginLoading ? 'Signing in…' : 'Sign In'}
              </button>

              <p className="text-xs text-muted" style={{ textAlign: 'center', marginTop: 8 }}>
                Don't have an account?{' '}
                <button type="button" style={{ background: 'none', border: 'none', color: 'var(--accent-light)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }} onClick={() => setTab('register')}>
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <UserPlus size={36} style={{ color: 'var(--accent-light)', margin: '0 auto 8px' }} />
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Create Account</div>
                <div className="text-sm text-muted">Register to track and manage your complaints</div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Your full name" required />
              </div>

              <div className="form-group">
                <label className="form-label">College Email *</label>
                <input className="form-input" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="you@kcet.ac.in" required autoComplete="email" />
              </div>

              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Register Number</label>
                  <input className="form-input" value={regNumber} onChange={e => setRegNumber(e.target.value)} placeholder="21CS001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select className="form-select" value={regSemester} onChange={e => setRegSemester(e.target.value)}>
                    <option value="">— Select —</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Branch / Department</label>
                <select className="form-select" value={regBranch} onChange={e => setRegBranch(e.target.value)}>
                  <option value="">— Select Branch —</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Password * (min. 8 chars)</label>
                <div className="password-field">
                  <input
                    className="form-input"
                    type={showRegPass ? 'text' : 'password'}
                    value={regPass}
                    onChange={e => setRegPass(e.target.value)}
                    placeholder="••••••••"
                    required minLength={8} autoComplete="new-password"
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowRegPass(v => !v)}>
                    {showRegPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  className="form-input"
                  type="password"
                  value={regConfirm}
                  onChange={e => setRegConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                {regConfirm && regPass !== regConfirm && (
                  <div className="form-error">Passwords do not match</div>
                )}
              </div>

              <div className="alert alert--info" style={{ fontSize: 12, marginTop: 4 }}>
                <Shield size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>Your account data is secure. Only authorized staff can view complaint-linked personal information.</div>
              </div>

              <button type="submit" className="btn btn--primary btn--full" disabled={regLoading || (regConfirm && regPass !== regConfirm)}>
                <UserPlus size={16} /> {regLoading ? 'Creating account…' : 'Create Account'}
              </button>

              <p className="text-xs text-muted" style={{ textAlign: 'center' }}>
                Already have an account?{' '}
                <button type="button" style={{ background: 'none', border: 'none', color: 'var(--accent-light)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }} onClick={() => setTab('login')}>
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Staff login note */}
        <div style={{ textAlign: 'center', marginTop: 20 }} className="fade-up-2">
          <span className="text-xs text-muted">College staff? </span>
          <Link to="/login" style={{ fontSize: 12, color: 'var(--accent-light)', fontWeight: 600 }}>
            Use Staff Login <ArrowRight size={11} style={{ display: 'inline', marginLeft: 2 }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
