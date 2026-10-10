import { Shield, Lock, Eye, EyeOff, FileText, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, marginBottom: 12, color: 'var(--text)', letterSpacing: '-0.5px' }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.75 }}>{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="section" style={{ padding: '48px 20px' }}>
      <div className="container container--sm">
        {/* Header */}
        <div className="card fade-up" style={{ marginBottom: 32, textAlign: 'center', background: 'linear-gradient(135deg, var(--surface), var(--surface2))' }}>
          <Shield size={40} style={{ color: 'var(--accent-light)', margin: '0 auto 12px' }} />
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>
            Privacy Policy
          </h1>
          <p className="text-sm text-muted">
            Last updated: September 2026 · KCET SmartGrievance is a prototype system developed for academic purposes.
          </p>
        </div>

        <div className="card fade-up-1">
          <Section title="1. Information We Collect">
            <p>When you use KCET SmartGrievance, we may collect:</p>
            <ul style={{ marginTop: 10, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>• <strong>Complaint content</strong> — the text, location, and date you provide when submitting a complaint, suggestion, or appreciation.</li>
              <li>• <strong>Account information</strong> (if registered) — name, college email address, register number, branch, and semester.</li>
              <li>• <strong>Uploaded files</strong> — photos, PDFs, or documents you voluntarily attach as evidence.</li>
              <li>• <strong>Session tokens</strong> — a randomly generated identifier stored in your browser to allow anonymous complaint tracking without an account.</li>
              <li>• <strong>Usage data</strong> — general analytics such as complaint category distribution and resolution times (never individual-level behavioral data).</li>
            </ul>
          </Section>

          <Section title="2. Anonymous Reporting">
            <p>
              When you select <strong>"Submit anonymously"</strong>, your name and contact information are NOT recorded. Only your complaint content and a randomly generated tracking ID are stored. Anonymous complaints cannot be linked back to your identity by system staff.
            </p>
            <p style={{ marginTop: 8 }}>
              <strong>Important:</strong> Even anonymous complaints are stored in our database. If a complaint involves a serious safety concern (ragging, threats), authorized safety officers may be required to act on it regardless of anonymity.
            </p>
          </Section>

          <Section title="3. Sensitive Complaints (Safety Reports)">
            <p>
              Complaints submitted via the <Link to="/safety" style={{ color: 'var(--accent-light)' }}>Safety Report</Link> page (for ragging, harassment, bullying, discrimination, etc.) are stored in a <strong>separate, restricted database collection</strong>.
            </p>
            <ul style={{ marginTop: 10, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>• Access is limited to authorized safety officers and the designated Anti-Ragging/Grievance Committee only.</li>
              <li>• Department staff and administrators without safety authorization cannot view sensitive complaints.</li>
              <li>• Sensitive complaint content is excluded from all public-facing statistics and analytics.</li>
              <li>• The complainant's identity (if provided) is protected and not disclosed to unauthorized parties.</li>
            </ul>
          </Section>

          <Section title="4. How We Use Your Information">
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>• Route your complaint to the appropriate department for investigation.</li>
              <li>• Allow you to track complaint status using your Tracking ID.</li>
              <li>• Enable authorized staff to review and respond to complaints.</li>
              <li>• Generate anonymized analytics to help the institution improve services.</li>
              <li>• Send complaint status notifications (if you have an account or provided contact details).</li>
            </ul>
          </Section>

          <Section title="5. Who Can See Your Data">
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>• <strong>Anonymous complaints</strong> — content visible to relevant department staff and administrators. No identity attached.</li>
              <li>• <strong>Identified complaints</strong> — name and email visible to department staff handling your case and administrators.</li>
              <li>• <strong>Safety complaints</strong> — content and identity (if provided) visible only to authorized safety officers.</li>
              <li>• <strong>Account data</strong> — only you and system administrators can view your profile information.</li>
              <li>• Your data is NEVER shared with third parties for commercial purposes.</li>
            </ul>
          </Section>

          <Section title="6. Data Retention">
            <p>
              Complaint data is retained for a minimum of <strong>2 academic years</strong> to maintain an audit trail and allow resolution tracking. After this period, data may be anonymized or archived.
            </p>
            <p style={{ marginTop: 8 }}>
              Browser-stored tracking IDs (localStorage) are only retained until you clear your browser data. We do not use cookies for tracking.
            </p>
          </Section>

          <Section title="7. NLP and Automated Classification">
            <p>
              Our NLP (Natural Language Processing) system reads complaint text to automatically suggest a category and department. <strong>It does not:</strong>
            </p>
            <ul style={{ marginTop: 8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>• Determine whether a complaint is true or valid.</li>
              <li>• Make disciplinary decisions.</li>
              <li>• Automatically reject or close complaints.</li>
            </ul>
            <p style={{ marginTop: 8 }}>All NLP predictions are reviewed and may be corrected by authorized staff before action is taken.</p>
          </Section>

          <Section title="8. Security Measures">
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>• Passwords are hashed using bcrypt (never stored in plain text).</li>
              <li>• Authentication uses JWT tokens with an 8-hour expiry.</li>
              <li>• Role-based access control ensures each user sees only what they are authorized to access.</li>
              <li>• File uploads are stored on the server with access restricted to authorized routes.</li>
            </ul>
          </Section>

          <Section title="9. Your Rights">
            <p>You have the right to:</p>
            <ul style={{ marginTop: 8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>• Access your own complaint history using your Tracking ID.</li>
              <li>• Update your account profile information at any time.</li>
              <li>• Submit complaints anonymously without creating an account.</li>
              <li>• Contact the college grievance cell to request information about data held about you.</li>
            </ul>
          </Section>

          <Section title="10. Disclaimer">
            <div className="alert alert--warning" style={{ marginTop: 8 }}>
              <span>⚠️</span>
              <span>
                KCET SmartGrievance is a <strong>prototype system</strong> developed for academic demonstration purposes. It is not an official service of Kamaraj College of Engineering and Technology. The complaint categories and workflows are proposed — confirm with college administration before any official deployment.
              </span>
            </div>
          </Section>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/help" className="btn btn--ghost btn--sm"><FileText size={13} /> Help Center</Link>
            <Link to="/submit" className="btn btn--primary btn--sm"><Shield size={13} /> Submit Complaint</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
