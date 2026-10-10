import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Shield, Phone, Mail, FileText, HelpCircle, AlertTriangle, Clock, Search, Users, CheckCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'Who can submit a complaint through KCET SmartGrievance?',
    a: 'Any student enrolled at Kamaraj College of Engineering and Technology can submit a complaint. You can do so anonymously (no account needed) or by creating a student account for better tracking across devices.',
  },
  {
    q: 'What is a Tracking ID and how do I use it?',
    a: 'After submitting a complaint, you receive a unique Tracking ID (e.g., KCET-2026-A1B2C3). Save this ID and use it on the "Track Complaint" page to check the current status, view admin responses, and see the full timeline of your complaint.',
  },
  {
    q: 'What happens to my complaint after I submit it?',
    a: 'Your complaint is received by the system and automatically classified by our NLP engine. A grievance officer reviews it and assigns it to the relevant department. The department investigates and responds. You can track every step using your Tracking ID.',
  },
  {
    q: 'Can I submit a complaint anonymously?',
    a: 'Yes! You can choose "Submit anonymously" when filling in the complaint form. Your identity will not be stored. You will still receive a Tracking ID to monitor status. Note: for anonymous complaints, staff cannot contact you for follow-up information.',
  },
  {
    q: 'How long does it take to resolve a complaint?',
    a: 'Resolution time varies by category and complexity. Simple facility complaints (broken equipment, water issues) are typically resolved within 3–7 days. Academic complaints may take up to 14 days. Safety and sensitive complaints are treated with the highest urgency. You will be notified at every step.',
  },
  {
    q: 'What is the difference between a Complaint, Suggestion, and Appreciation?',
    a: 'A Complaint reports an issue or problem that needs resolution. A Suggestion proposes an improvement or new idea for the college. An Appreciation acknowledges excellent service or behavior by college staff or facilities. All three are tracked through the same system.',
  },
  {
    q: 'Is my safety complaint kept confidential?',
    a: 'Yes. Safety complaints (ragging, harassment, bullying, etc.) are stored in a separate, restricted queue. Only authorized safety officers and the designated grievance committee can access them. They are never visible in public-facing statistics or to unauthorized staff.',
  },
  {
    q: 'What does "NLP Classification" mean?',
    a: 'NLP (Natural Language Processing) is an AI system that reads your complaint text and automatically suggests the most relevant category and department. This helps route complaints faster. However, authorized staff always review and can correct the classification — NLP does not make final decisions.',
  },
  {
    q: 'Can I attach photos or documents to my complaint?',
    a: 'Yes. On Step 2 of the complaint form, you can attach up to 5 files (photos, PDFs, documents) of up to 10MB each. This helps staff understand the issue better. Files are stored securely and only accessible to authorized personnel.',
  },
  {
    q: 'What should I do in an emergency or if I am in immediate danger?',
    a: 'This system is NOT for emergencies. If you or someone else is in immediate danger, contact campus security immediately or call 100 (Police) / 108 (Ambulance). Use this system only after ensuring everyone is safe.',
  },
  {
    q: 'Can I reopen a complaint if it was not properly resolved?',
    a: 'Yes. After a complaint is marked as Resolved, you can submit a new complaint referencing the original Tracking ID, or contact the grievance cell directly. There is also a feedback mechanism on the tracking page once a complaint is resolved.',
  },
  {
    q: 'How do I log in as a student vs as staff?',
    a: 'Students use the "Student Login" page accessible from the top navigation. Staff, administrators, and grievance officers use the "Staff Login" page. These are separate accounts with different dashboards and access levels.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(v => !v)}>
        {q}
        <ChevronDown size={18} className="faq-chevron" />
      </button>
      <div className="faq-answer">{a}</div>
    </div>
  );
}

export default function HelpSupport() {
  const [search, setSearch] = useState('');
  const filtered = FAQS.filter(f =>
    !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, var(--bg2) 0%, var(--bg3) 100%)', padding: '64px 28px 48px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div className="section-eyebrow">Help Center</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 16 }}>
          How can we help you?
        </h1>
        <p className="text-2" style={{ maxWidth: 540, margin: '0 auto 28px', fontSize: 16, lineHeight: 1.65 }}>
          Find answers to frequently asked questions about submitting complaints, tracking status, and using the SmartGrievance portal.
        </p>
        <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 42, fontSize: 15 }}
            placeholder="Search help topics…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* Quick cards */}
      <section className="section--sm" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div className="steps-grid">
            {[
              { icon: <FileText size={22} style={{ color: 'var(--accent-light)' }} />, title: 'Submit a Complaint', desc: 'Report any issue — from hostel problems to academic concerns — with optional anonymous mode.', link: '/submit', cta: 'Submit Now' },
              { icon: <Search size={22} style={{ color: 'var(--green)' }} />, title: 'Track Your Complaint', desc: 'Enter your Tracking ID to see the current status, department assignment, and admin responses.', link: '/track', cta: 'Track Status' },
              { icon: <Shield size={22} style={{ color: 'var(--safety)' }} />, title: 'Safety Report', desc: 'Report ragging, harassment, or threats confidentially. Only authorized officers can see these.', link: '/safety', cta: 'Report Safely' },
              { icon: <Users size={22} style={{ color: 'var(--purple)' }} />, title: 'Student Account', desc: 'Create an account to track all your complaints across devices and receive email notifications.', link: '/student-login', cta: 'Get Started' },
            ].map(card => (
              <Link to={card.link} key={card.title} className="step-card" style={{ textDecoration: 'none', cursor: 'pointer', transition: 'all var(--transition-lg)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {card.icon}
                </div>
                <div className="step-card__title">{card.title}</div>
                <div className="step-card__desc">{card.desc}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-light)', marginTop: 4 }}>{card.cta} →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency notice */}
      <div style={{ padding: '0 28px' }}>
        <div className="safety-emergency" style={{ maxWidth: 1240, margin: '0 auto', borderRadius: 'var(--radius)' }}>
          <AlertTriangle size={16} style={{ display: 'inline', marginRight: 8, flexShrink: 0 }} />
          <strong>Emergency?</strong> This system is NOT for emergencies. If you are in immediate danger, call{' '}
          <strong>100 (Police)</strong> or <strong>108 (Ambulance)</strong> immediately.
          For campus security: contact the KCET security office directly.
        </div>
      </div>

      {/* FAQ */}
      <section className="section">
        <div className="container container--sm">
          <div className="section-eyebrow">FAQ</div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-sub">
            {search
              ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search}"`
              : 'Everything you need to know about the KCET SmartGrievance portal.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.length > 0
              ? filtered.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)
              : (
                <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                  <HelpCircle size={36} style={{ color: 'var(--text-3)', margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 600 }}>No results found</div>
                  <p className="text-sm text-muted mt-2">Try a different keyword or browse all FAQs above.</p>
                  <button className="btn btn--ghost btn--sm" style={{ marginTop: 16 }} onClick={() => setSearch('')}>Clear search</button>
                </div>
              )}
          </div>
        </div>
      </section>

      {/* Contact info */}
      <section className="section--sm" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
        <div className="container container--sm">
          <div className="section-eyebrow">Contact</div>
          <h2 className="section-title">Still need help?</h2>
          <div className="grid-2" style={{ gap: 16 }}>
            {[
              { icon: <Mail size={20} style={{ color: 'var(--accent-light)' }} />, title: 'Grievance Cell Email', desc: 'grievance@kcet.ac.in', sub: 'Response within 2 working days' },
              { icon: <Phone size={20} style={{ color: 'var(--green)' }} />, title: 'Grievance Cell Phone', desc: '+91 9XXXXXXXXX', sub: 'Mon–Sat, 9am–5pm' },
              { icon: <Clock size={20} style={{ color: 'var(--amber)' }} />, title: 'Office Hours', desc: '9:00 AM – 5:00 PM', sub: 'Monday to Saturday (excluding holidays)' },
              { icon: <CheckCircle size={20} style={{ color: 'var(--purple)' }} />, title: 'Anti-Ragging Helpline', desc: '1800-180-5522', sub: 'UGC 24×7 toll-free helpline' },
            ].map(c => (
              <div key={c.title} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {c.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.title}</div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>{c.desc}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{c.sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
