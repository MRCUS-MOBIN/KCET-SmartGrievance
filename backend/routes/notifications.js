import { Router } from 'express';
import Notification from '../models/Notification.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build notification for a complaint event */
export async function createComplaintNotification({ sessionToken, userId, type, trackingId, extraMessage = '' }) {
  const templates = {
    complaint_submitted: { title: 'Complaint Submitted', message: `Your complaint ${trackingId} has been received and is under initial review.` },
    complaint_assigned:  { title: 'Complaint Assigned',  message: `Complaint ${trackingId} has been assigned to a department for action.` },
    status_changed:      { title: 'Status Updated',      message: `The status of complaint ${trackingId} has been updated. ${extraMessage}` },
    admin_response:      { title: 'New Response',        message: `An authorized staff member has responded to complaint ${trackingId}. ${extraMessage}` },
    complaint_resolved:  { title: 'Complaint Resolved',  message: `Complaint ${trackingId} has been marked as resolved. ${extraMessage}` },
    complaint_reopened:  { title: 'Complaint Reopened',  message: `Complaint ${trackingId} has been reopened for further review.` },
    escalation:          { title: 'Complaint Escalated', message: `Complaint ${trackingId} has been escalated for urgent attention.` },
  };

  const tmpl = templates[type] || { title: 'Update', message: `Complaint ${trackingId} has been updated.` };

  try {
    await Notification.create({
      userId: userId || null,
      sessionToken: sessionToken || null,
      type,
      title: tmpl.title,
      message: tmpl.message,
      relatedComplaintId: trackingId,
    });
  } catch (e) {
    console.error('Notification create error:', e.message);
  }
}

// ── GET /api/notifications ─────────────────────────────────────────────────────
// Accepts: ?sessionToken=xxx for anonymous users, or JWT for authenticated users
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { sessionToken } = req.query;
    const userId = req.user?.id;

    if (!userId && !sessionToken) {
      return res.json({ notifications: [], unread: 0 });
    }

    const query = userId
      ? { userId }
      : { sessionToken };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unread = notifications.filter(n => !n.isRead).length;

    res.json({ notifications, unread });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch notifications.' });
  }
});

// ── PATCH /api/notifications/:id/read ─────────────────────────────────────────
router.patch('/:id/read', optionalAuth, async (req, res) => {
  try {
    const { sessionToken } = req.body;
    const userId = req.user?.id;

    const query = { _id: req.params.id };
    if (userId) query.userId = userId;
    else if (sessionToken) query.sessionToken = sessionToken;

    await Notification.findOneAndUpdate(query, { isRead: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Could not update notification.' });
  }
});

// ── PATCH /api/notifications/read-all ─────────────────────────────────────────
router.patch('/read-all', optionalAuth, async (req, res) => {
  try {
    const { sessionToken } = req.body;
    const userId = req.user?.id;

    const query = {};
    if (userId) query.userId = userId;
    else if (sessionToken) query.sessionToken = sessionToken;
    else return res.json({ ok: true });

    await Notification.updateMany(query, { isRead: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Could not update notifications.' });
  }
});

export default router;
