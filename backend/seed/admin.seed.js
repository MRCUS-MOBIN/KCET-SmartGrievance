/**
 * KCET 360° SmartGrievance — Admin User Seeder
 * Run: node seed/admin.seed.js
 * Creates the default admin account in MongoDB.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

import User from '../models/User.js';

const ADMIN = {
  name: 'Admin',
  email: 'admin@kcet.ac.in',
  password: 'Admin@1234',
  role: 'admin',
  department: 'Administration',
};

async function seed() {
  const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kcet_360_smartgrievance';
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const existing = await User.findOne({ email: ADMIN.email });
  if (existing) {
    console.log(`⚠️  Admin already exists: ${ADMIN.email}`);
  } else {
    await User.create(ADMIN);
    console.log(`✅ Admin created!`);
    console.log(`   📧 Email   : ${ADMIN.email}`);
    console.log(`   🔑 Password: ${ADMIN.password}`);
    console.log(`   👤 Role    : ${ADMIN.role}`);
  }

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
