import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name, registerNumber: user.registerNumber, department: user.department || '' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// ── POST /api/auth/login  (staff / admin / grievance_officer) ─────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });
    if (user.role === 'student') return res.status(403).json({ message: 'Students must use the student login.' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = signToken(user);
    return res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed.' });
  }
});

// ── POST /api/auth/student/register ──────────────────────────────────────────
router.post('/student/register', async (req, res) => {
  try {
    const { name, email, password, registerNumber = '', branch = '', semester } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanReg   = registerNumber ? String(registerNumber).trim().toUpperCase() : null;

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return res.status(409).json({ message: 'Email already registered.' });

    if (cleanReg) {
      const regExisting = await User.findOne({ registerNumber: cleanReg });
      if (regExisting) return res.status(409).json({ message: 'Register number already used.' });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: cleanEmail,
      password,
      role: 'student',
      registerNumber: cleanReg || undefined,
      branch: String(branch).trim(),
      semester: semester ? parseInt(semester) : null,
    });

    const token = signToken(user);
    return res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (err) {
    console.error('Student Register Error:', err);
    res.status(500).json({ message: 'Registration failed: ' + (err.message || '') });
  }
});

// ── POST /api/auth/student/login ──────────────────────────────────────────────
// Accepts email OR register number as identifier (case-insensitive)
router.post('/student/login', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/Register number and password required.' });
    }

    const cleanId = String(identifier).trim();

    // Query both email and registerNumber at once
    let user = await User.findOne({
      $or: [
        { email: cleanId.toLowerCase() },
        { registerNumber: cleanId.toUpperCase() }
      ],
      isActive: true
    });

    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });
    if (user.role !== 'student') {
      return res.status(403).json({ message: 'This login is for students only. Use Staff Login for staff accounts.' });
    }

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = signToken(user);
    return res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    console.error('Student Login Error:', err);
    res.status(500).json({ message: 'Login failed.' });
  }
});

// ── POST /api/auth/register  (admin creates staff / grievance_officer accounts) ─
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'staff', department = '' } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password required.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered.' });

    const user = await User.create({ name, email, password, role, department });
    const token = signToken(user);
    return res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed.' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user.toSafeJSON());
  } catch {
    res.status(500).json({ message: 'Could not fetch user.' });
  }
});

// ── PATCH /api/auth/profile  (update own profile) ────────────────────────────
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { name, phone, branch, semester, department } = req.body || {};
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (branch !== undefined) updates.branch = branch;
    if (semester !== undefined) updates.semester = semester ? parseInt(semester) : null;
    if (department !== undefined) updates.department = department;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user.toSafeJSON());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Profile update failed.' });
  }
});

// ── PATCH /api/auth/change-password ──────────────────────────────────────────
router.patch('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect.' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Password change failed.' });
  }
});

export default router;
