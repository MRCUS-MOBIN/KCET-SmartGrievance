import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  by:     { type: String, default: 'system' },
  byRole: { type: String, default: 'system' },
  note:   { type: String, default: '', maxlength: 1000 },
  at:     { type: Date, default: Date.now },
}, { _id: false });

const complaintSchema = new mongoose.Schema({
  trackingId:   { type: String, unique: true, required: true, index: true },
  institution:  { type: String, default: 'Kamaraj College of Engineering and Technology' },

  // Submission identity
  submittedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  submissionMode: { type: String, enum: ['anonymous', 'identified'], default: 'anonymous' },
  studentName:    { type: String, default: '', maxlength: 120 },
  studentId:      { type: String, default: '', maxlength: 50 },
  studentDept:    { type: String, default: '', maxlength: 100 },
  contactEmail:   { type: String, default: '', maxlength: 200 },

  // Type of submission
  complaintType: {
    type: String,
    enum: ['complaint', 'suggestion', 'appreciation'],
    default: 'complaint',
  },

  // Category
  mainCategory: { type: String, required: true, maxlength: 120 },
  subcategory:  { type: String, default: '', maxlength: 200 },

  // Content
  description: { type: String, required: true, minlength: 8, maxlength: 5000 },
  location: {
    block:       { type: String, default: '', maxlength: 150 },
    area:        { type: String, default: '', maxlength: 150 },
    freeText:    { type: String, default: '', maxlength: 300 },
  },
  incidentDate: { type: Date, default: null },

  // NLP prediction
  nlp: {
    predictedCategory:  { type: String, default: '' },
    confidence:         { type: Number, default: null },
    isSensitive:        { type: Boolean, default: false },
    suggestedDepartment:{ type: String, default: '' },
    needsHumanReview:   { type: Boolean, default: true },
    method:             { type: String, default: '' },
    top3:               { type: Array,  default: [] },
    correctedBy:        { type: String, default: null },
  },

  // Routing
  assignedDepartment: { type: String, default: '' },
  assignedTo:         { type: String, default: '' }, // staff user id
  isSensitive:        { type: Boolean, default: false },

  // Status lifecycle
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Awaiting Information', 'In Progress', 'Escalated', 'Resolved', 'Reopened', 'Closed'],
    default: 'Submitted',
    index: true,
  },
  statusHistory: [statusHistorySchema],

  // Attachments (file paths / URLs)
  attachments: [{ type: String }],

  // Social / deduplication
  supportCount: { type: Number, default: 0 },
  supporters:   [{ type: String }], // session tokens (not student IDs for anon)

  // Resolution
  resolutionNote:  { type: String, default: '', maxlength: 2000 },
  resolvedAt:      { type: Date, default: null },
  adminResponse:   { type: String, default: '', maxlength: 2000 }, // visible to student
  feedback: {
    rating:      { type: Number, default: null },
    comment:     { type: String, default: '', maxlength: 1000 },
    submittedAt: { type: Date, default: null },
  },

  // Audit
  createdAt:  { type: Date, default: Date.now, index: true },
  updatedAt:  { type: Date, default: Date.now },
}, { timestamps: { updatedAt: 'updatedAt' } });

// Only expose safe fields to public tracking endpoint
complaintSchema.methods.toPublicView = function () {
  return {
    trackingId:         this.trackingId,
    complaintType:      this.complaintType,
    mainCategory:       this.mainCategory,
    subcategory:        this.subcategory,
    status:             this.status,
    assignedDepartment: this.isSensitive ? 'Restricted — Safety Review' : this.assignedDepartment,
    nlpCategory:        this.nlp?.predictedCategory || '',
    nlpConfidence:      this.nlp?.confidence ?? null,
    statusHistory:      this.statusHistory.map(h => ({
      status: h.status, note: h.note, at: h.at,
    })),
    adminResponse:      this.isSensitive ? '' : (this.adminResponse || ''),
    createdAt:          this.createdAt,
    resolvedAt:         this.resolvedAt,
  };
};

export default mongoose.model('Complaint', complaintSchema);
