import { Router } from 'express';
import crypto from 'node:crypto';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { upload } from '../middleware/upload.js';
import { createComplaintNotification } from './notifications.js';

const router = Router();
const NLP_URL = process.env.NLP_URL || 'http://127.0.0.1:8001';
const SENSITIVE_CATEGORIES = new Set(['Safety, Respect & Student Protection']);

const CATEGORY_TO_DEPARTMENT = {
  'Hostel & Residential Facilities': 'Hostel Management',
  'All Academic Departments': 'Relevant Department HOD / Principal',
  'Laboratories & Workshops': 'IT Department',
  'Canteen & Food Services': 'Canteen Management',
  'Campus Infrastructure & Maintenance': 'Facilities & Maintenance Department',
  'Toilets & Sanitation': 'Facilities & Maintenance Department',
  'Transport & College Buses': 'Transport Office',
  'Physical Education (PT) & Sports': 'Physical Education Department',
  'Library & Learning Resources': 'Librarian',
  'Xerox, Stationery & Campus Shops': 'Campus Administration',
  'IT, Wi-Fi & Digital Services': 'IT Department',
  'Examinations & Academic Administration': 'Examinations Cell / COE',
  'Fees, Scholarships & Finance': 'Accounts & Finance Office',
  'Student Welfare & Health': 'Student Welfare Officer',
  'Safety, Respect & Student Protection': 'Safety Review Committee (RESTRICTED)',
  'Faculty, Staff & Department Administration': 'Relevant Department HOD / Principal',
  'Placement, Internship & Career Services': 'Placement Cell',
  'Campus Environment & Sustainability': 'Facilities & Administration',
  'Events, Clubs & Student Activities': 'Student Affairs / Dean of Students',
  'Administration & General Services': 'College Administration Office',
};

async function callNLP(text) {
  try {
    const res = await fetch(`${NLP_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return await res.json();
  } catch { /* NLP offline — complaint still saved, needs human review */ }
  return null;
}

// ── POST /api/complaints — Submit complaint ─────────────────────────────────
router.post('/', optionalAuth, upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      submissionMode = 'anonymous',
      complaintType  = 'complaint',
      mainCategory   = '',
      subcategory    = '',
      description    = '',
      location       = '{}',
      studentName    = '',
      studentId      = '',
      studentDept    = '',
      contactEmail   = '',
      incidentDate   = null,
    } = req.body || {};

    if (typeof description !== 'string' || description.trim().length < 8) {
      return res.status(400).json({ message: 'Please provide at least 8 characters describing the issue.' });
    }
    if (!mainCategory) {
      return res.status(400).json({ message: 'Please select a complaint category.' });
    }

    // Parse location safely
    let loc = {};
    try { loc = JSON.parse(location); } catch { loc = { freeText: String(location) }; }

    // NLP prediction
    const nlpResult = await callNLP(description.trim());
    const isSensitive = SENSITIVE_CATEGORIES.has(mainCategory) || nlpResult?.isSensitive === true;

    const trackingId = `KCET-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const defaultDept = CATEGORY_TO_DEPARTMENT[mainCategory] || '';

    // Build complaint payload — strip identity for anonymous submissions
    const complaintData = {
      trackingId,
      submissionMode,
      complaintType,
      mainCategory: String(mainCategory).slice(0, 120),
      subcategory:  String(subcategory).slice(0, 200),
      description:  description.trim(),
      location:     loc,
      isSensitive,
      nlp: nlpResult ? {
        predictedCategory:   nlpResult.predictedCategory,
        confidence:          nlpResult.confidence,
        isSensitive:         nlpResult.isSensitive,
        suggestedDepartment: nlpResult.suggestedDepartment || defaultDept,
        needsHumanReview:    nlpResult.needsHumanReview,
        method:              nlpResult.method,
        top3:                nlpResult.top3 || [],
      } : { needsHumanReview: true, method: 'nlp-offline' },
      assignedDepartment: nlpResult?.suggestedDepartment || defaultDept,
      statusHistory: [{ status: 'Submitted', by: 'system', note: 'Complaint received.' }],
      attachments: (req.files || []).map(f => f.filename),
      incidentDate: incidentDate ? new Date(incidentDate) : null,
    };

    // If user is logged in, link submission to student account
    if (req.user) {
      complaintData.submittedBy = req.user.id;
      if (!contactEmail) complaintData.contactEmail = req.user.email;
      if (!studentName)  complaintData.studentName  = req.user.name;
      if (!studentId && req.user.registerNumber) complaintData.studentId = req.user.registerNumber;
    }

    // Only include identity if identified mode or logged in
    if (submissionMode === 'identified') {
      if (studentName)  complaintData.studentName  = String(studentName).slice(0, 120);
      if (studentId)    complaintData.studentId    = String(studentId).slice(0, 50);
      if (studentDept)  complaintData.studentDept  = String(studentDept).slice(0, 100);
      if (contactEmail) complaintData.contactEmail = String(contactEmail).slice(0, 200);
    }

    const complaint = await Complaint.create(complaintData);

    return res.status(201).json({
      trackingId: complaint.trackingId,
      status:     complaint.status,
      isSensitive: complaint.isSensitive,
      nlp: complaint.nlp,
      message: isSensitive
        ? 'Your report has been received and will be reviewed by authorized safety officers only.'
        : 'Complaint submitted successfully.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not save complaint. Check MongoDB connection.' });
  }
});

// ── GET /api/complaints/my-complaints — Logged-in student's complaints ───────
router.get('/my-complaints', requireAuth, async (req, res) => {
  try {
    const { trackingIds } = req.query;
    let extraIds = [];
    if (trackingIds) {
      try { extraIds = JSON.parse(trackingIds); } catch { extraIds = String(trackingIds).split(','); }
    }

    const userConditions = [
      { submittedBy: req.user.id },
    ];
    if (req.user.email) {
      userConditions.push({ contactEmail: req.user.email.toLowerCase() });
    }
    if (req.user.registerNumber) {
      userConditions.push({ studentId: req.user.registerNumber.toUpperCase() });
    }

    let finalQuery = { $or: userConditions };
    if (extraIds.length > 0) {
      finalQuery = {
        $or: [
          ...userConditions,
          { trackingId: { $in: extraIds }, submittedBy: req.user.id }
        ]
      };
    }

    const complaints = await Complaint.find(finalQuery).sort({ createdAt: -1 });
    res.json({ complaints });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch your complaints.' });
  }
});

// ── GET /api/complaints/public-stats — Public aggregate stats (no auth) ──────
// Returns category counts only — no complaint text, no identity, no sensitive data.
router.get('/public-stats', async (_req, res) => {
  try {
    const [total, resolved, inProgress] = await Promise.all([
      Complaint.countDocuments({ isSensitive: { $ne: true } }),
      Complaint.countDocuments({ status: 'Resolved', isSensitive: { $ne: true } }),
      Complaint.countDocuments({ status: 'In Progress', isSensitive: { $ne: true } }),
    ]);
    const byCategory = await Complaint.aggregate([
      { $match: { isSensitive: { $ne: true } } },
      { $group: { _id: '$mainCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
    res.json({
      total,
      resolved,
      inProgress,
      resolvedPct: total > 0 ? Math.round((resolved / total) * 100) : 0,
      topCategories: byCategory.map(d => ({ category: d._id, count: d.count })),
    });
  } catch { res.status(500).json({ message: 'Stats unavailable.' }); }
});

// ── GET /api/complaints/track/:trackingId — Public tracking ──────────────────
router.get('/track/:trackingId', async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ trackingId: req.params.trackingId });
    if (!complaint) return res.status(404).json({ message: 'Tracking ID not found.' });
    return res.json(complaint.toPublicView());
  } catch { res.status(500).json({ message: 'Tracking lookup failed.' }); }
});

// ── GET /api/complaints — Staff: list assigned complaints ────────────────────
router.get('/', requireAuth, requireRole(['staff', 'admin', 'grievance_officer']), async (req, res) => {
  try {
    const { status, category, department, page = 1, limit = 20, sensitive } = req.query;
    const filter = {};

    // Grievance officers see sensitive; staff see non-sensitive
    if (req.user.role === 'grievance_officer' || req.user.role === 'admin') {
      if (sensitive === 'only') filter.isSensitive = true;
      else if (sensitive === 'exclude') filter.isSensitive = { $ne: true };
    } else {
      // Regular staff never see sensitive complaints
      filter.isSensitive = { $ne: true };
    }

    // Staff can only see their own department complaints (unless admin/grievance_officer)
    if (req.user.role === 'staff') {
      const deptFilter = department || req.user.department;
      if (deptFilter) {
        const matchedCategories = Object.keys(CATEGORY_TO_DEPARTMENT).filter(cat =>
          CATEGORY_TO_DEPARTMENT[cat].toLowerCase().includes(deptFilter.toLowerCase().trim())
        );
        filter.$or = [
          { assignedDepartment: { $regex: deptFilter.trim(), $options: 'i' } },
          { mainCategory: { $in: matchedCategories } },
        ];
        if (deptFilter.toLowerCase().includes('principal')) {
          filter.$or.push({ assignedDepartment: { $regex: 'principal', $options: 'i' } });
        }
      }
    } else if (department) {
      filter.assignedDepartment = { $regex: department.trim(), $options: 'i' };
    }

    if (status)   filter.status = status;
    if (category) filter.mainCategory = { $regex: category, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [complaints, total] = await Promise.all([
      Complaint.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Complaint.countDocuments(filter),
    ]);

    res.json({ complaints, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch complaints.' });
  }
});


// ── PATCH /api/complaints/:id/status — Update status ────────────────────────
router.patch('/:id/status', requireAuth, requireRole(['staff', 'admin', 'grievance_officer']), async (req, res) => {
  try {
    const { status, note = '', department = '' } = req.body || {};
    const VALID = ['Submitted', 'Under Review', 'Awaiting Information', 'In Progress', 'Escalated', 'Resolved', 'Reopened', 'Closed'];
    if (!VALID.includes(status)) return res.status(400).json({ message: 'Invalid status value.' });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    // Role guard: regular staff cannot update sensitive complaints
    if (complaint.isSensitive && !['admin', 'grievance_officer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to update this complaint.' });
    }

    complaint.status = status;
    if (department) complaint.assignedDepartment = department;
    if (status === 'Resolved') complaint.resolvedAt = new Date();
    complaint.statusHistory.push({ status, by: req.user.name || req.user.email, byRole: req.user.role, note });

    await complaint.save();
    res.json({ trackingId: complaint.trackingId, status: complaint.status, updatedAt: complaint.updatedAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Status update failed.' });
  }
});

// ── PATCH /api/complaints/:id/nlp — Correct NLP prediction ──────────────────
router.patch('/:id/nlp', requireAuth, requireRole(['staff', 'admin', 'grievance_officer']), async (req, res) => {
  try {
    const { correctedCategory, correctedDepartment } = req.body || {};
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    if (correctedCategory) {
      complaint.nlp.predictedCategory = correctedCategory;
      complaint.nlp.correctedBy = req.user.name || req.user.email;
      complaint.nlp.needsHumanReview = false;
      complaint.mainCategory = correctedCategory;
    }
    if (correctedDepartment) complaint.assignedDepartment = correctedDepartment;

    await complaint.save();
    res.json({ message: 'NLP prediction corrected.', complaint: complaint.toPublicView() });
  } catch {
    res.status(500).json({ message: 'NLP correction failed.' });
  }
});

// ── POST /api/complaints/:id/support — Upvote / group complaint ─────────────
// Students can support an existing complaint using an anonymous session token.
// Prevents one session from supporting the same complaint more than once.
router.post('/:id/support', async (req, res) => {
  try {
    const { sessionToken } = req.body || {};
    if (!sessionToken) return res.status(400).json({ message: 'Session token required.' });

    const complaint = await Complaint.findOne({
      $or: [{ trackingId: req.params.id }, { _id: req.params.id }],
    });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    if (complaint.isSensitive) return res.status(403).json({ message: 'Cannot support sensitive complaints.' });
    if (complaint.supporters.includes(sessionToken))
      return res.status(409).json({ message: 'You have already supported this complaint.' });

    complaint.supporters.push(sessionToken);
    complaint.supportCount = complaint.supporters.length;
    await complaint.save();
    res.json({ trackingId: complaint.trackingId, supportCount: complaint.supportCount, message: 'Support recorded.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not record support.' });
  }
});

// ── PUT /api/complaints/:id/assign — Assign to department ────────────────────
router.put('/:id/assign', requireAuth, requireRole(['staff', 'admin', 'grievance_officer']), async (req, res) => {
  try {
    const { department } = req.body || {};
    if (!department) return res.status(400).json({ message: 'Department is required.' });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    complaint.assignedDepartment = department;
    complaint.status = complaint.status === 'Submitted' ? 'Under Review' : complaint.status;
    complaint.statusHistory.push({
      status: complaint.status,
      by: req.user.name || req.user.email,
      byRole: req.user.role,
      note: `Assigned to ${department}`,
    });
    await complaint.save();

    // ── Notify the department staff ──────────────────────────────────────────
    try {
      const deptStaff = await User.findOne({
        department: { $regex: department.trim(), $options: 'i' },
        role: { $in: ['staff', 'grievance_officer'] },
        isActive: true,
      });
      if (deptStaff) {
        await createComplaintNotification({
          userId: deptStaff._id.toString(),
          type: 'complaint_assigned',
          trackingId: complaint.trackingId,
          extraMessage: `Category: ${complaint.mainCategory}. Assigned by ${req.user.name || req.user.email}.`,
        });
      }
    } catch (notifErr) {
      console.error('Dept notification error:', notifErr.message);
    }
    // ─────────────────────────────────────────────────────────────────────────

    res.json({ trackingId: complaint.trackingId, assignedDepartment: complaint.assignedDepartment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Assignment failed.' });
  }
});

// ── POST /api/complaints/:id/response — Admin response to student ─────────────
router.post('/:id/response', requireAuth, requireRole(['staff', 'admin', 'grievance_officer']), async (req, res) => {
  try {
    const { response } = req.body || {};
    if (!response?.trim()) return res.status(400).json({ message: 'Response text is required.' });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    complaint.adminResponse = response.trim().slice(0, 2000);
    complaint.statusHistory.push({
      status: complaint.status,
      by: req.user.name || req.user.email,
      byRole: req.user.role,
      note: 'Staff response posted.',
    });
    await complaint.save();
    res.json({ message: 'Response saved.', trackingId: complaint.trackingId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not save response.' });
  }
});

// ── POST /api/complaints/:trackingId/feedback — Student rating after resolution
router.post('/:trackingId/feedback', async (req, res) => {
  try {
    const { rating, comment = '' } = req.body || {};
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }
    const complaint = await Complaint.findOne({ trackingId: req.params.trackingId });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    if (!['Resolved', 'Closed'].includes(complaint.status)) {
      return res.status(400).json({ message: 'Feedback can only be submitted for resolved complaints.' });
    }

    complaint.feedback = { rating: Number(rating), comment: String(comment).slice(0, 1000), submittedAt: new Date() };
    await complaint.save();
    res.json({ message: 'Feedback recorded. Thank you!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not save feedback.' });
  }
});

// ── POST /api/complaints/:id/escalate — Escalate to next level ───────────────
router.post('/:id/escalate', requireAuth, requireRole(['staff', 'admin', 'grievance_officer']), async (req, res) => {

  try {
    const { note = '', escalateTo = '' } = req.body || {};
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    // Role guard: regular staff cannot escalate sensitive
    if (complaint.isSensitive && !['admin', 'grievance_officer'].includes(req.user.role))
      return res.status(403).json({ message: 'Not authorized to escalate this complaint.' });

    complaint.status = 'Escalated';
    complaint.assignedDepartment = escalateTo || complaint.assignedDepartment;
    complaint.statusHistory.push({
      status: 'Escalated',
      by: req.user.name || req.user.email,
      byRole: req.user.role,
      note: note || `Escalated by ${req.user.role}. Routed to: ${escalateTo || 'next level'}.`,
    });
    await complaint.save();
    res.json({ trackingId: complaint.trackingId, status: 'Escalated', escalatedTo: escalateTo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Escalation failed.' });
  }
});

export default router;
