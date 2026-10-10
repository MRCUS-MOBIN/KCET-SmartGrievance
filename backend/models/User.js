import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, maxlength: 150 },
  email:      { type: String, required: true, unique: true, lowercase: true, maxlength: 200 },
  password:   { type: String, required: true, minlength: 8 },
  role: {
    type: String,
    enum: ['student', 'staff', 'admin', 'grievance_officer'],
    default: 'staff',
  },
  department: { type: String, default: '', maxlength: 150 },
  // Student-specific fields
  registerNumber: { type: String, maxlength: 30 },
  branch:         { type: String, default: '', maxlength: 100 },
  semester:       { type: Number, default: null, min: 1, max: 8 },
  phone:          { type: String, default: '', maxlength: 15 },
  isActive:       { type: Boolean, default: true },
  createdAt:      { type: Date, default: Date.now },
}, { timestamps: true });

// Hash before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Never expose password hash
userSchema.methods.toSafeJSON = function () {
  const { password, __v, ...rest } = this.toObject();
  return rest;
};

export default mongoose.model('User', userSchema);
