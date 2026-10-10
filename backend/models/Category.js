import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true },
  label:        { type: String, required: true },
  icon:         { type: String, default: '📋' },
  color:        { type: String, default: '#6b7280' },
  description:  { type: String, default: '' },
  isSensitive:  { type: Boolean, default: false },
  sensitiveNote:{ type: String, default: '' },
  subcategories:[{ type: String }],
  isActive:     { type: Boolean, default: true },
  sortOrder:    { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
