import { Router } from 'express';
import RoutingRule from '../models/RoutingRule.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

// GET /api/routing — list all routing rules (staff/admin can view)
router.get('/', requireAuth, requireRole(['staff', 'admin', 'grievance_officer']), async (_req, res) => {
  try {
    const rules = await RoutingRule.find({ isActive: true }).sort({ categoryLabel: 1 });
    res.json(rules);
  } catch { res.status(500).json({ message: 'Could not fetch routing rules.' }); }
});

// PATCH /api/routing/:id — admin configures routing
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const rule = await RoutingRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) return res.status(404).json({ message: 'Routing rule not found.' });
    res.json(rule);
  } catch { res.status(500).json({ message: 'Routing update failed.' }); }
});

export default router;
