import { Router } from 'express';
import Complaint from '../models/Complaint.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();
const guard = [requireAuth, requireRole(['admin', 'grievance_officer'])];

// GET /api/analytics/summary — overview stats
router.get('/summary', ...guard, async (_req, res) => {
  try {
    const [total, resolved, inProgress, escalated, sensitive] = await Promise.all([
      Complaint.countDocuments({}),
      Complaint.countDocuments({ status: 'Resolved' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Escalated' }),
      Complaint.countDocuments({ isSensitive: true }),
    ]);
    res.json({ total, resolved, inProgress, escalated, sensitive, pending: total - resolved });
  } catch { res.status(500).json({ message: 'Analytics failed.' }); }
});

// GET /api/analytics/by-category — complaints per main category
router.get('/by-category', ...guard, async (_req, res) => {
  try {
    const data = await Complaint.aggregate([
      { $group: { _id: '$mainCategory', count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } } } },
      { $sort: { count: -1 } },
    ]);
    res.json(data.map(d => ({ category: d._id, count: d.count, resolved: d.resolved })));
  } catch { res.status(500).json({ message: 'Analytics failed.' }); }
});

// GET /api/analytics/by-status — complaints by current status
router.get('/by-status', ...guard, async (_req, res) => {
  try {
    const data = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(data.map(d => ({ status: d._id, count: d.count })));
  } catch { res.status(500).json({ message: 'Analytics failed.' }); }
});

// GET /api/analytics/by-type — complaint vs suggestion vs appreciation
router.get('/by-type', ...guard, async (_req, res) => {
  try {
    const data = await Complaint.aggregate([
      { $group: { _id: '$complaintType', count: { $sum: 1 } } },
    ]);
    res.json(data.map(d => ({ type: d._id, count: d.count })));
  } catch { res.status(500).json({ message: 'Analytics failed.' }); }
});

// GET /api/analytics/trend?days=30 — daily submission trend
router.get('/trend', ...guard, async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const data = await Complaint.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json(data.map(d => ({ date: d._id, count: d.count })));
  } catch { res.status(500).json({ message: 'Trend analytics failed.' }); }
});

// GET /api/analytics/by-subcategory — top 15 recurring subcategories
router.get('/by-subcategory', ...guard, async (_req, res) => {
  try {
    const data = await Complaint.aggregate([
      { $match: { subcategory: { $ne: '' }, isSensitive: { $ne: true } } },
      { $group: { _id: '$subcategory', count: { $sum: 1 }, category: { $first: '$mainCategory' } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);
    res.json(data.map(d => ({ subcategory: d._id, category: d.category, count: d.count })));
  } catch { res.status(500).json({ message: 'Subcategory analytics failed.' }); }
});

// GET /api/analytics/avg-resolution — average days to resolve per category
router.get('/avg-resolution', ...guard, async (_req, res) => {
  try {
    const data = await Complaint.aggregate([
      { $match: { status: 'Resolved', resolvedAt: { $ne: null } } },
      {
        $group: {
          _id: '$mainCategory',
          avgDays: {
            $avg: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60 * 24] },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgDays: 1 } },
    ]);
    res.json(data.map(d => ({ category: d._id, avgDays: Math.round(d.avgDays * 10) / 10, count: d.count })));
  } catch { res.status(500).json({ message: 'Avg resolution analytics failed.' }); }
});

// GET /api/analytics/escalation-rate — escalation % per category
router.get('/escalation-rate', ...guard, async (_req, res) => {
  try {
    const data = await Complaint.aggregate([
      {
        $group: {
          _id: '$mainCategory',
          total: { $sum: 1 },
          escalated: { $sum: { $cond: [{ $eq: ['$status', 'Escalated'] }, 1, 0] } },
        },
      },
      { $match: { total: { $gte: 1 } } },
      { $sort: { escalated: -1 } },
    ]);
    res.json(data.map(d => ({
      category: d._id,
      total: d.total,
      escalated: d.escalated,
      rate: Math.round((d.escalated / d.total) * 100),
    })));
  } catch { res.status(500).json({ message: 'Escalation rate analytics failed.' }); }
});

export default router;
