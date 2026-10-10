/**
 * KCET 360° SmartGrievance — Safety & Confidential Reporting Module
 * Routes under /api/safety
 *
 * Access:
 *  - POST /api/safety/report       — PUBLIC (any student, anonymous or identified)
 *  - GET  /api/safety/cases        — RESTRICTED: grievance_officer, admin only
 *  - GET  /api/safety/cases/:ref   — RESTRICTED: grievance_officer, admin only
 *  - PATCH /api/safety/cases/:ref/status — RESTRICTED: grievance_officer, admin only
 *
 * This module NEVER exposes sensitive reports to ordinary staff dashboards.
 * NLP assists category suggestion ONLY — it does NOT determine truth or guilt.
 * Emergency guidance is informational — the system does NOT contact services automatically.
 */

import { Router } from 'express';
import crypto from 'node:crypto';
import Complaint from '../models/Complaint.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { upload } from '../middleware/upload.js';

const router = Router();
const NLP_URL = process.env.NLP_URL || 'http://127.0.0.1:8001';

const SAFETY_SUBCATEGORIES = [
  'Ragging — physical, verbal, or psychological',
  'Bullying and intimidation',
  'Physical harm or assault',
  'Sexual harassment (POSH Act)',
  'Cyberbullying or online harassment',
  'Stalking — physical or digital',
  'Discrimination — caste, gender, religion, disability',
  'Threats and coercion',
  'Retaliation for reporting an issue',
  'Unsafe campus condition or immediate danger',
  'Privacy violation or personal data misuse',
  'Other safety or protection concern',
];

async function callNLP(text) {
  try {
    const res = await fetch(`${NLP_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return await res.json();
  } catch { /* NLP offline — safety report still saved */ }
  return null;
}

// ── POST /api/safety/report — Submit safety/confidential report ───────────────
router.post('/report', upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      submissionMode = 'anonymous',
      subcategory    = '',
      description    = '',
      location       = '{}',
      studentName    = '',
      contactEmail   = '',
      incidentDate   = null,
    } = req.body || {};

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ message: 'Please describe the incident in at least 10 characters.' });
    }

    let loc = {};
    try { loc = JSON.parse(location); } catch { loc = { freeText: String(location) }; }

    const nlpResult = await callNLP(description.trim());
    const caseRef = `KCET-SAFE-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const reportData = {
      trackingId:    caseRef,
      submissionMode,
      complaintType: 'complaint',
      mainCategory:  'Safety, Respect & Student Protection',
      subcategory:   String(subcategory).slice(0, 200),
      description:   description.trim(),
      location:      loc,
      isSensitive:   true,
      assignedDepartment: 'Safety Review Committee (RESTRICTED)',
      nlp: nlpResult ? {
        predictedCategory:   nlpResult.predictedCategory,
        confidence:          nlpResult.confidence,
        isSensitive:         true,
        suggestedDepartment: 'Safety Review Committee (RESTRICTED)',
        needsHumanReview:    true, // Always true for safety reports
        method:              nlpResult.method,
      } : { needsHumanReview: true, method: 'nlp-offline' },
      statusHistory: [{ status: 'Submitted', by: 'system', note: 'Safety report received. Under confidential review.' }],
      attachments: (req.files || []).map(f => f.filename),
      incidentDate: incidentDate ? new Date(incidentDate) : null,
    };

    // Include contact only if identified submission
    if (submissionMode === 'identified') {
      if (studentName)  reportData.studentName  = String(studentName).slice(0, 120);
      if (contactEmail) reportData.contactEmail = String(contactEmail).slice(0, 200);
    }

    const complaint = await Complaint.create(reportData);

    return res.status(201).json({
      caseRef: complaint.trackingId,
      status:  complaint.status,
      message: 'Your report has been received securely. It will be reviewed ONLY by authorized safety officers. Your identity is protected.',
      emergency: 'For immediate danger, contact campus security or dial 100 (Police) / 108 (Ambulance). This system does NOT automatically contact emergency services.',
    });
  } catch (err) {
    console.error('Safety report error:', err);
    res.status(500).json({ message: 'Could not submit report. Please try again or contact the college directly.' });
  }
});

// ── GET /api/safety/cases — List safety cases (restricted) ───────────────────
router.get('/cases', requireAuth, requireRole(['admin', 'grievance_officer']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { isSensitive: true };
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [cases, total] = await Promise.all([
      Complaint.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Complaint.countDocuments(filter),
    ]);
    res.json({ cases, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch { res.status(500).json({ message: 'Could not fetch safety cases.' }); }
});

// ── GET /api/safety/cases/:ref — Single case detail ──────────────────────────
router.get('/cases/:ref', requireAuth, requireRole(['admin', 'grievance_officer']), async (req, res) => {
  try {
    const c = await Complaint.findOne({ trackingId: req.params.ref, isSensitive: true });
    if (!c) return res.status(404).json({ message: 'Case not found.' });
    res.json(c);
  } catch { res.status(500).json({ message: 'Could not fetch case.' }); }
});

// ── PATCH /api/safety/cases/:ref/status — Update safety case status ──────────
router.patch('/cases/:ref/status', requireAuth, requireRole(['admin', 'grievance_officer']), async (req, res) => {
  try {
    const { status, note = '' } = req.body || {};
    const VALID = ['Submitted', 'Under Review', 'Awaiting Information', 'In Progress', 'Escalated', 'Resolved', 'Closed'];
    if (!VALID.includes(status)) return res.status(400).json({ message: 'Invalid status.' });

    const complaint = await Complaint.findOne({ trackingId: req.params.ref, isSensitive: true });
    if (!complaint) return res.status(404).json({ message: 'Case not found.' });

    complaint.status = status;
    if (status === 'Resolved') complaint.resolvedAt = new Date();
    complaint.statusHistory.push({
      status,
      by: req.user.name || req.user.email,
      byRole: req.user.role,
      note: String(note).slice(0, 1000),
    });

    await complaint.save();
    res.json({ caseRef: complaint.trackingId, status: complaint.status });
  } catch { res.status(500).json({ message: 'Status update failed.' }); }
});

// GET /api/safety/categories — Return safety subcategory list (public, for form)
router.get('/categories', (_req, res) => {
  res.json({ subcategories: SAFETY_SUBCATEGORIES });
});

export default router;
