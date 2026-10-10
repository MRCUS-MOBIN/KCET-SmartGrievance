import mongoose from 'mongoose';

const routingRuleSchema = new mongoose.Schema({
  categoryId:          { type: String, required: true, unique: true },
  categoryLabel:       { type: String, required: true },
  responsibleOffice:   { type: String, required: true },
  backupOffice:        { type: String, default: 'College Administration Office' },
  escalationPath: [{
    level:  { type: Number },
    office: { type: String },
    afterDays: { type: Number },
  }],
  isSensitive:         { type: Boolean, default: false },
  restrictedToRoles:   [{ type: String }], // e.g. ['grievance_officer', 'admin']
  isActive:            { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('RoutingRule', routingRuleSchema);
