import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn, Shield, Eye, EyeOff } from 'lucide-react';

const API = 'http://localhost:5000/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      localStorage.setItem('kcet_token', data.token);
      localStorage.setItem('kcet_user', JSON.stringify(data.user));
      toast.success(`Welcome, ${data.user.name}!`);
      const role = data.user.role;
      if (role === 'admin' || role === 'grievance_officer') navigate('/admin');
      else navigate('/staff');
      window.location.reload();
    } catch (err) {
      toast.error(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section" style={{ minHeight: '82vh', display: 'flex', alignItems: 'center', padding: '40px 20px' }}>
      <div className="container container--xs">

        <div style={{ textAlign: 'center', marginBottom: 28 }} className="fade-up">
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔐</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>
            Staff Portal Login
          </h1>
          <p className="text-sm text-muted">
            For authorized department staff, administrators, and grievance officers.
          </p>
        </div>

        <div className="form-panel form-panel--auth fade-up-1" style={{ maxWidth: 440, margin: '0 auto' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="staff@kcet.ac.in"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-field">
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  minLength={8}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn--primary btn--full" disabled={loading} style={{ marginTop: 4 }}>
              <LogIn size={16} /> {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="divider" />

          <div className="alert alert--info" style={{ fontSize: 13 }}>
            <Shield size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              This login is <strong>for authorized college staff only</strong>. Students should use{' '}
              <a href="/student-login" style={{ color: 'var(--blue)' }}>Student Login</a>.
              For confidential safety reports, use the{' '}
              <a href="/safety" style={{ color: 'var(--blue)' }}>Safety Report</a> page — no login required.
            </div>
          </div>

          <p className="text-xs text-muted" style={{ textAlign: 'center', marginTop: 8 }}>
            KCET SmartGrievance · Prototype · Not an official KCET service
          </p>
        </div>
      </div>
    </div>
  );
}
