/**
 * KCET 360° SmartGrievance — Department Staff Seeder
 * Run: node seed/departments.seed.js
 * Creates one staff account per department with email + password.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

import User from '../models/User.js';

// ── Department Staff Accounts ──────────────────────────────────────────────────
const DEPARTMENT_STAFF = [
  {
    name: 'Hostel Management Staff',
    email: 'hostel@kcet.ac.in',
    password: 'Hostel@1234',
    role: 'staff',
    department: 'Hostel Management',
  },
  {
    name: 'Canteen Management Staff',
    email: 'canteen@kcet.ac.in',
    password: 'Canteen@1234',
    role: 'staff',
    department: 'Canteen Management',
  },
  {
    name: 'Facilities & Maintenance Staff',
    email: 'maintenance@kcet.ac.in',
    password: 'Maintain@1234',
    role: 'staff',
    department: 'Facilities & Maintenance Department',
  },
  {
    name: 'Transport Office Staff',
    email: 'transport@kcet.ac.in',
    password: 'Transport@1234',
    role: 'staff',
    department: 'Transport Office',
  },
  {
    name: 'Physical Education Staff',
    email: 'sports@kcet.ac.in',
    password: 'Sports@1234',
    role: 'staff',
    department: 'Physical Education Department',
  },
  {
    name: 'Library Staff',
    email: 'library@kcet.ac.in',
    password: 'Library@1234',
    role: 'staff',
    department: 'Librarian',
  },
  {
    name: 'IT Department Staff',
    email: 'it@kcet.ac.in',
    password: 'ITDept@1234',
    role: 'staff',
    department: 'IT Department',
  },
  {
    name: 'Examinations Cell Staff',
    email: 'exams@kcet.ac.in',
    password: 'Exams@1234',
    role: 'staff',
    department: 'Examinations Cell / COE',
  },
  {
    name: 'Accounts & Finance Staff',
    email: 'finance@kcet.ac.in',
    password: 'Finance@1234',
    role: 'staff',
    department: 'Accounts & Finance Office',
  },
  {
    name: 'Student Welfare Staff',
    email: 'welfare@kcet.ac.in',
    password: 'Welfare@1234',
    role: 'staff',
    department: 'Student Welfare Officer',
  },
  {
    name: 'Safety Grievance Officer',
    email: 'safety@kcet.ac.in',
    password: 'Safety@1234',
    role: 'grievance_officer',
    department: 'Safety Review Committee (RESTRICTED)',
  },
  {
    name: 'Faculty Admin HOD',
    email: 'faculty.admin@kcet.ac.in',
    password: 'Faculty@1234',
    role: 'staff',
    department: 'Relevant Department HOD / Principal',
  },
  {
    name: 'Placement Cell Staff',
    email: 'placement@kcet.ac.in',
    password: 'Placement@1234',
    role: 'staff',
    department: 'Placement Cell',
  },
  {
    name: 'Campus Environment Staff',
    email: 'environment@kcet.ac.in',
    password: 'Environ@1234',
    role: 'staff',
    department: 'Facilities & Administration',
  },
  {
    name: 'Student Affairs Staff',
    email: 'events@kcet.ac.in',
    password: 'Events@1234',
    role: 'staff',
    department: 'Student Affairs / Dean of Students',
  },
  {
    name: 'Administration Office Staff',
    email: 'admin.office@kcet.ac.in',
    password: 'AdminOff@1234',
    role: 'staff',
    department: 'College Administration Office',
  },
  {
    name: 'Campus Shop Coordinator',
    email: 'campus.shop@kcet.ac.in',
    password: 'CampusShop@1234',
    role: 'staff',
    department: 'Campus Administration',
  },
  {
    name: 'System Admin',
    email: 'admin@kcet.ac.in',
    password: 'Admin@1234',
    role: 'admin',
    department: 'Administration',
  },
  {
    name: 'Mobin',
    email: '24uit093@kamarajengg.edu.in',
    password: 'Student@1234',
    role: 'student',
    registerNumber: '24UIT093',
    branch: 'Information Technology',
    semester: 5,
  },
  {
    name: 'Demo Student',
    email: 'student@kcet.ac.in',
    password: 'Student@1234',
    role: 'student',
    registerNumber: '920421104001',
    branch: 'Computer Science',
    semester: 6,
  },
];

export async function seedDepartments() {
  let created = 0;
  let skipped = 0;
  for (const staff of DEPARTMENT_STAFF) {
    const existing = await User.findOne({ email: staff.email });
    if (existing) {
      skipped++;
    } else {
      await User.create(staff);
      created++;
    }
  }
  console.log(`✅ Seeded ${created} department staff & admin accounts (${skipped} existing)`);
}

async function seed() {
  const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kcet_360_smartgrievance';
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');
  console.log('━'.repeat(70));

  await seedDepartments();

  console.log('━'.repeat(70));

  // Print login table
  console.log('\n📋 Department Staff Login Credentials:\n');
  console.log('Department'.padEnd(40) + 'Email'.padEnd(35) + 'Password');
  console.log('─'.repeat(100));
  for (const s of DEPARTMENT_STAFF) {
    console.log(s.department.padEnd(40) + s.email.padEnd(35) + s.password);
  }
  console.log('\n');

  await mongoose.disconnect();
}

if (process.argv[1] && process.argv[1].endsWith('departments.seed.js')) {
  seed().catch(err => { console.error(err); process.exit(1); });
}
