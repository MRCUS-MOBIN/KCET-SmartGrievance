import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,  // null = anonymous student notification stored locally
  },
  // For anonymous students we key by session token
  sessionToken: { type: String, default: null },
  type: {
    type: String,
    enum: [
      'complaint_submitted',
      'complaint_assigned',
      'status_changed',
      'admin_response',
      'complaint_resolved',
      'complaint_reopened',
      'escalation',
    ],
    required: true,
  },
  title:   { type: String, required: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 500 },
  relatedComplaintId: { type: String, default: null }, // trackingId
  isRead:  { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ sessionToken: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
