import { Router } from 'express';
import Category from '../models/Category.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

// GET /api/categories — public catalogue
router.get('/', async (_req, res) => {
  try {
    const cats = await Category.find({ isActive: true }).sort({ sortOrder: 1, label: 1 });
    res.json(cats);
  } catch { res.status(500).json({ message: 'Could not fetch categories.' }); }
});

// POST /api/categories — admin only (seed or add new)
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json(cat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/categories/:id — admin toggle active/inactive
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ message: 'Category not found.' });
    res.json(cat);
  } catch { res.status(500).json({ message: 'Update failed.' }); }
});

export default router;
