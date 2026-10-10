import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { User, Mail, BookOpen, Phone, Lock, Save, Edit3, GraduationCap, Eye, EyeOff, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuthUser, getAuthToken } from '../App.jsx';

const API = 'http://localhost:5000/api';

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

const BRANCHES = ['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'IT', 'Chemical', 'Biomedical', 'Other'];

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const token = getAuthToken();

  const [profile, setProfile] = useState(user || {});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editBranch, setEditBranch] = useState(user?.branch || '');
  const [editSemester, setEditSemester] = useState(user?.semester || '');
  const [editDept, setEditDept] = useState(user?.department || '');

  // Password change
  const [pwSection, setPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (!user || !token) { navigate('/student-login'); return; }
    // Fetch fresh profile
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setProfile(d); setEditName(d.name || ''); setEditPhone(d.phone || ''); setEditBranch(d.branch || ''); setEditSemester(d.semester || ''); setEditDept(d.department || ''); } })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, phone: editPhone, branch: editBranch, semester: editSemester, department: editDept }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProfile(data);
      localStorage.setItem('kcet_user', JSON.stringify(data));
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message || 'Update failed.');
    }
    setSaving(false);
  }

  async function handleChangePassword() {
    if (!currentPw || !newPw || !confirmPw) return toast.error('All password fields are required.');
    if (newPw.length < 8) return toast.error('New password must be at least 8 characters.');
    if (newPw !== confirmPw) return toast.error('New passwords do not match.');
    setChangingPw(true);
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Password changed successfully!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPwSection(false);
    } catch (err) {
      toast.error(err.message || 'Password change failed.');
    }
    setChangingPw(false);
  }

  function logout() {
    localStorage.removeItem('kcet_token');
    localStorage.removeItem('kcet_user');
    navigate('/');
    window.location.reload();
  }

  const roleLabel = { student: 'Student', staff: 'Department Staff', admin: 'Administrator', grievance_officer: 'Grievance Officer' };

  return (
    <div className="section" style={{ padding: '40px 20px' }}>
      <div className="container container--sm">
        <div className="section-eyebrow">Account</div>
        <h1 className="section-title mb-6">My Profile</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          {/* Profile card */}
          <div className="card fade-up">
            {/* Avatar + info header */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="profile-avatar-lg">{initials(profile.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                  {profile.name || '—'}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, background: 'var(--accent-dim)', color: 'var(--accent-light)', padding: '3px 10px', borderRadius: 'var(--radius-pill)', fontWeight: 600 }}>
                    {roleLabel[profile.role] || profile.role}
                  </span>
                  {profile.branch && (
                    <span style={{ fontSize: 12, background: 'var(--surface2)', color: 'var(--text-2)', padding: '3px 10px', borderRadius: 'var(--radius-pill)' }}>
                      {profile.branch}
                    </span>
                  )}
                  {profile.semester && (
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Sem {profile.semester}</span>
                  )}
                </div>
              </div>
              <button className="btn btn--ghost btn--sm" onClick={() => setEditing(v => !v)}>
                <Edit3 size={13} /> {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="divider" />

            {!editing ? (
              /* View mode */
              <div>
                {[
                  { icon: <Mail size={15} />, label: 'Email', value: profile.email },
                  { icon: <GraduationCap size={15} />, label: 'Register Number', value: profile.registerNumber || '—' },
                  { icon: <BookOpen size={15} />, label: 'Branch', value: profile.branch || '—' },
                  { icon: <BookOpen size={15} />, label: 'Semester', value: profile.semester ? `Semester ${profile.semester}` : '—' },
                  { icon: <Phone size={15} />, label: 'Phone', value: profile.phone || '—' },
                  { icon: <User size={15} />, label: 'Department', value: profile.department || '—' },
                ].filter(f => f.value !== '—' || ['Email', 'Register Number'].includes(f.label)).map(f => (
                  <div key={f.label} className="profile-field">
                    <div className="profile-field__label flex items-center gap-2">
                      <span style={{ color: 'var(--text-3)' }}>{f.icon}</span> {f.label}
                    </div>
                    <div className="profile-field__value">{f.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              /* Edit mode */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+91 9XXXXXXXXX" />
                </div>
                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <select className="form-select" value={editBranch} onChange={e => setEditBranch(e.target.value)}>
                      <option value="">— Select —</option>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <select className="form-select" value={editSemester} onChange={e => setEditSemester(e.target.value)}>
                      <option value="">— Select —</option>
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
                </div>
                {profile.role !== 'student' && (
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input className="form-input" value={editDept} onChange={e => setEditDept(e.target.value)} placeholder="Your department" />
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saving}>
                    <Save size={13} /> {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Security card */}
          <div className="card fade-up-1">
            <div className="flex items-center justify-between">
              <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={16} style={{ color: 'var(--accent-light)' }} /> Security
              </div>
              <button className="btn btn--ghost btn--sm" onClick={() => setPwSection(v => !v)}>
                {pwSection ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {pwSection && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <div className="password-field">
                    <input className="form-input" type={showPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
                    <button type="button" className="password-toggle" onClick={() => setShowPw(v => !v)}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" minLength={8} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input className="form-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
                  {confirmPw && newPw !== confirmPw && <div className="form-error">Passwords do not match</div>}
                </div>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={handleChangePassword}
                  disabled={changingPw || (confirmPw && newPw !== confirmPw)}
                >
                  <Lock size={13} /> {changingPw ? 'Changing…' : 'Update Password'}
                </button>
              </div>
            )}

            {!pwSection && (
              <p className="text-sm text-muted">Keep your account secure with a strong password. We recommend updating it periodically.</p>
            )}
          </div>

          {/* Danger zone */}
          <div className="card fade-up-2" style={{ borderColor: 'var(--safety-border)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--safety)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <LogOut size={16} /> Sign Out
            </div>
            <p className="text-sm text-muted mb-4">Sign out of your account on this device. Your complaint history will still be saved.</p>
            <button className="btn btn--danger btn--sm" onClick={logout}>
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
