import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, FileText, Search, Cpu, Users, ArrowRight,
  AlertTriangle, CheckCircle2, Clock, Star, ChevronRight
} from 'lucide-react';
import CATEGORIES from '../data/categories.js';

const NLP_EXAMPLES = [
  { text: '"Hostel bathroom water is not coming"',      category: 'Hostel → Plumbing',        dept: 'Hostel Maintenance' },
  { text: '"CSE lab computers are not working"',        category: 'CSE → Lab Equipment',       dept: 'CSE Lab In-Charge' },
  { text: '"Canteen meals are served cold"',            category: 'Canteen → Food Quality',    dept: 'Canteen Management' },
  { text: '"Bus 5 is arriving late every day"',         category: 'Transport → Bus Timing',    dept: 'Transport Office' },
  { text: '"Girls\' toilet door lock is broken"',       category: 'Sanitation → Maintenance',  dept: 'Facilities Staff' },
  { text: '"My internal marks are incorrect"',          category: 'Examination → Assessment',  dept: 'Examinations Cell' },
  { text: '"Xerox shop charges more than displayed"',   category: 'Campus Shop → Pricing',     dept: 'Administration' },
];

const HOW_IT_WORKS = [
  { n: '01', title: 'Submit Your Complaint', desc: 'Choose a category, describe the issue, and optionally attach evidence. Anonymous submission available — no login required.' },
  { n: '02', title: 'NLP Auto-Routes It', desc: 'Our AI instantly classifies your complaint and suggests the right department, so it reaches the right people faster.' },
  { n: '03', title: 'Staff Reviews & Acts', desc: 'Authorized department staff investigate and take action. Every status change is logged with a timestamp.' },
  { n: '04', title: 'Track & Get Resolved', desc: 'Use your Tracking ID to monitor progress in real time. Get notified when the status changes or a response is posted.' },
];

const FEATURES = [
  { icon: <Cpu size={20} />, title: 'NLP Auto-Classification', desc: 'TF-IDF + Logistic Regression auto-predicts category. Confidence score + human-review flag for every prediction.' },
  { icon: <Shield size={20} />, title: 'Safety Module', desc: 'Separate restricted queue for ragging, harassment, bullying — visible only to authorized safety officers.' },
  { icon: <Users size={20} />, title: 'Multi-Role Dashboards', desc: 'Student, staff, admin, grievance officer — each sees only what they are authorized to see.' },
  { icon: <FileText size={20} />, title: 'Complaint + Suggestion + Appreciation', desc: 'Report problems, suggest improvements, or appreciate good service — all in one system.' },
  { icon: <AlertTriangle size={20} />, title: 'Multi-Level Escalation', desc: 'Staff → HOD → Grievance Officer → Principal — every status change recorded in the audit trail.' },
  { icon: <Search size={20} />, title: 'Anonymous Tracking', desc: 'Unique Tracking ID without revealing identity. Track updates without logging in.' },
];

export default function LandingPage() {
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/complaints/public-stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setLiveStats(d); })
      .catch(() => {});
  }, []);

  return (
    <main>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__grid" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero__eyebrow">Kamaraj College of Engineering and Technology</div>
          <h1 className="hero__title">
            One portal for<br /><em>every student concern.</em>
          </h1>
          <p className="hero__sub">
            NLP-powered · Anonymous option · Department-wise routing · 20 categories · 200+ subcategories
          </p>
          <div className="hero__actions">
            <Link to="/submit" className="btn btn--primary btn--lg">
              <FileText size={18} /> Submit a Complaint
            </Link>
            <Link to="/track" className="btn btn--ghost btn--lg">
              <Search size={18} /> Track Your Complaint
            </Link>
            <Link to="/safety" className="btn btn--danger btn--lg">
              <Shield size={18} /> Safety Report
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 48 }}>
            {[
              { icon: <CheckCircle2 size={14} />, label: 'Anonymous Option' },
              { icon: <Shield size={14} />, label: 'Confidential Safety Queue' },
              { icon: <Clock size={14} />, label: 'Real-time Tracking' },
              { icon: <Star size={14} />, label: 'NLP Auto-Routing' },
            ].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', padding: '6px 14px' }}>
                <span style={{ color: 'var(--green)' }}>{b.icon}</span> {b.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Public Stats ── */}
      {liveStats && (
        <div style={{ padding: '0 28px' }}>
          <div className="live-stats-strip">
            <div className="live-stats-label">
              <div className="live-stats-dot" />
              Live Campus Data
            </div>
            <div className="live-stat">
              <div className="live-stat__value">{liveStats.total}</div>
              <div className="live-stat__label">Complaints Filed</div>
            </div>
            <div className="live-stat">
              <div className="live-stat__value" style={{ color: 'var(--green)' }}>{liveStats.resolvedPct}%</div>
              <div className="live-stat__label">Resolution Rate</div>
            </div>
            <div className="live-stat">
              <div className="live-stat__value" style={{ color: 'var(--blue)' }}>{liveStats.inProgress}</div>
              <div className="live-stat__label">In Progress</div>
            </div>
            {liveStats.topCategories?.slice(0, 1).map(c => (
              <div key={c.category} className="live-stat">
                <div className="live-stat__value" style={{ fontSize: 16, color: 'var(--amber)' }}>#1</div>
                <div className="live-stat__label" style={{ maxWidth: 130, textAlign: 'center' }}>
                  {c.category.split(' ').slice(0, 3).join(' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats strip ── */}
      <div className="stats-strip">
        {[
          { value: '20', label: 'Complaint Categories' },
          { value: '200+', label: 'Subcategories' },
          { value: 'NLP', label: 'Auto Classification' },
          { value: '5', label: 'User Roles' },
          { value: '360°', label: 'Campus Coverage' },
          { value: '∞', label: 'Anonymous Option' },
        ].map(s => (
          <div key={s.label} className="stat-item">
            <div className="stat-item__value">{s.value}</div>
            <div className="stat-item__label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── How it works ── */}
      <section className="section">
        <div className="container">
          <div className="section-eyebrow">Process</div>
          <h2 className="section-title">How it works</h2>
          <p className="section-sub">From complaint submission to resolution — fully transparent at every step.</p>
          <div className="steps-grid">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.n} className="step-card fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="step-card__number">{step.n}</div>
                <div className="step-card__title">{step.title}</div>
                <div className="step-card__desc">{step.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link to="/submit" className="btn btn--primary">
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 20 Categories grid ── */}
      <section className="section--sm" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-eyebrow">Campus Complaint Directory</div>
          <h2 className="section-title">20 Categories · 360° Coverage</h2>
          <p className="section-sub">Every campus facility and service — one unified portal.</p>
          <div className="category-grid">
            {CATEGORIES.map(cat => (
              <Link
                to={`/submit?category=${encodeURIComponent(cat.label)}`}
                key={cat.id}
                className={`category-card${cat.isSensitive ? ' category-card--sensitive' : ''}`}
                style={{ '--cat-color': cat.color }}
              >
                <div className="category-card__icon">{cat.icon}</div>
                <div className="category-card__name">{cat.label}</div>
                <div className="category-card__desc">{cat.description}</div>
                <div className="category-card__count">
                  {cat.isSensitive ? '🔒 Confidential reporting' : `${cat.subcategories.length} subcategories →`}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── NLP Demo table ── */}
      <section className="section--sm">
        <div className="container">
          <div className="section-eyebrow">NLP Automatic Routing</div>
          <h2 className="section-title">How complaints get routed</h2>
          <p className="section-sub">
            NLP predicts the relevant category and suggests a department. Authorized staff always review and can correct the classification.
          </p>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="nlp-table">
              <thead>
                <tr>
                  <th>Student complaint</th>
                  <th>Predicted category</th>
                  <th>Suggested department</th>
                </tr>
              </thead>
              <tbody>
                {NLP_EXAMPLES.map((ex, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text)', fontStyle: 'italic' }}>{ex.text}</td>
                    <td><span className="nlp-pill">{ex.category}</span></td>
                    <td style={{ color: 'var(--text-2)' }}>{ex.dept}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted mt-3">
            NLP predicts the relevant category and suggests routing — it does not decide whether a complaint is true. Students and authorized staff can correct the classification.
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section--sm" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-eyebrow">Features</div>
          <h2 className="section-title">360° Feature Set</h2>
          <div className="grid-2" style={{ gap: 16, marginTop: 24 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="card fade-up card--glow">
                <div className="flex gap-3 items-center" style={{ color: 'var(--accent-light)' }}>
                  {f.icon}
                  <span style={{ fontWeight: 700 }}>{f.title}</span>
                </div>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Safety CTA ── */}
      <section className="section--sm">
        <div className="container container--sm">
          <div className="safety-banner">
            <Shield size={28} style={{ color: 'var(--safety)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Safety & Confidential Reporting</div>
              <p className="text-sm" style={{ color: '#fca5a5', marginBottom: 12 }}>
                For ragging, harassment, bullying, discrimination, threats, or any safety concern — submit a confidential report. Only authorized safety officers see these reports.
              </p>
              <div className="safety-emergency">
                ⚠️ For immediate danger, contact campus security or dial <strong>100</strong> (Police) / <strong>108</strong> (Ambulance). This system does <strong>NOT</strong> automatically contact emergency services.
              </div>
              <Link to="/safety" className="btn btn--danger btn--sm" style={{ marginTop: 14, display: 'inline-flex' }}>
                <Shield size={14} /> Submit Confidential Report <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer__grid">
          {/* Brand */}
          <div>
            <div className="footer__brand">
              <div className="navbar__logo-mark" style={{ width: 36, height: 36, fontSize: 18 }}>🛡️</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-light), #a0bfff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                KCET SmartGrievance
              </div>
            </div>
            <p className="footer__desc">
              A prototype NLP-powered campus grievance management system for Kamaraj College of Engineering and Technology. Developed for academic demonstration.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <div className="footer__section-title">Quick Links</div>
            {[
              { to: '/submit', label: 'Submit Complaint' },
              { to: '/track', label: 'Track Complaint' },
              { to: '/safety', label: 'Safety Report' },
              { to: '/my-complaints', label: 'My Dashboard' },
            ].map(l => <Link key={l.to} to={l.to} className="footer__link">{l.label}</Link>)}
          </div>

          {/* Account */}
          <div>
            <div className="footer__section-title">Account</div>
            {[
              { to: '/student-login', label: 'Student Login' },
              { to: '/login', label: 'Staff Login' },
              { to: '/profile', label: 'My Profile' },
              { to: '/notifications', label: 'Notifications' },
            ].map(l => <Link key={l.to} to={l.to} className="footer__link">{l.label}</Link>)}
          </div>

          {/* Help */}
          <div>
            <div className="footer__section-title">Help & Legal</div>
            {[
              { to: '/help', label: 'Help & FAQ' },
              { to: '/privacy', label: 'Privacy Policy' },
            ].map(l => <Link key={l.to} to={l.to} className="footer__link">{l.label}</Link>)}
            <div className="footer__section-title" style={{ marginTop: 16 }}>Emergency</div>
            <div className="footer__link" style={{ color: 'var(--safety)', fontWeight: 600 }}>100 — Police</div>
            <div className="footer__link" style={{ color: 'var(--safety)', fontWeight: 600 }}>108 — Ambulance</div>
            <div className="footer__link" style={{ color: 'var(--amber)' }}>1800-180-5522 — UGC Anti-Ragging</div>
          </div>
        </div>

        <div className="footer__bottom">
          <div>© 2026 KCET SmartGrievance · Prototype · Not an official KCET service</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/privacy" className="footer__link" style={{ padding: 0 }}>Privacy Policy</Link>
            <Link to="/help" className="footer__link" style={{ padding: 0 }}>Help</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
