/**
 * KCET 360° SmartGrievance — Category Seeder
 * Run: node seed/categories.seed.js
 * Seeds all 20 categories + routing rules into MongoDB.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

import Category   from '../models/Category.js';
import RoutingRule from '../models/RoutingRule.js';

const CATEGORIES = [
  { id: 'hostel',       label: 'Hostel & Residential Facilities',         icon: '🏠', color: '#6366f1', isSensitive: false, sortOrder: 1,
    description: 'Boys hostel, girls hostel, rooms, mess, water, electricity, laundry',
    subcategories: ['Boys Hostel — General','Girls Hostel — General','Room allocation and accommodation','Room cleanliness and maintenance','Water supply and drinking water','Electricity, fans, lights and charging points','Washrooms and bathroom hygiene','Hostel food and mess quality','Food quantity, menu and timing','Wi-Fi and internet in hostel','Laundry facilities','Safety, security and visitor management','Hostel rules, warden response and common areas'] },
  { id: 'academics',    label: 'All Academic Departments',                 icon: '🎓', color: '#0ea5e9', isSensitive: false, sortOrder: 2,
    description: 'CSE, IT, AI&DS, ECE, EEE, Biotech, Mechanical, Mechatronics, Civil',
    subcategories: ['CSE — Computer Science and Engineering','IT — Information Technology','AI & DS — Artificial Intelligence and Data Science','ECE — Electronics and Communication Engineering','EEE — Electrical and Electronics Engineering','Biotechnology','Mechanical Engineering','Mechatronics Engineering','Civil Engineering','Other / Future Departments','Teaching and academic support','Classroom facilities','Department office and administrative support','Timetable, academic schedule and class allocation','Project guidance and academic mentoring'] },
  { id: 'labs',         label: 'Laboratories & Workshops',                 icon: '🔬', color: '#10b981', isSensitive: false, sortOrder: 3,
    description: 'Equipment, computers, software, safety, scheduling',
    subcategories: ['Department-wise laboratory complaints','Damaged or non-working equipment','Insufficient computers or systems','Software installation and license issues','Internet and network connectivity in lab','Lab safety equipment and protective gear','Electrical safety and equipment maintenance','Insufficient lab materials or components','Workshop tools and machinery','Lab assistant support','Lab availability and scheduling','Practical class duration and access'] },
  { id: 'canteen',      label: 'Canteen & Food Services',                  icon: '🍽️', color: '#f59e0b', isSensitive: false, sortOrder: 4,
    description: 'Food quality, hygiene, pricing, timing, menu',
    subcategories: ['Food quality and taste','Food hygiene and cleanliness','Food quantity and portion size','Overpricing or billing issues','Menu variety and options','Serving timing and delays','Seating and dining area cleanliness','Staff behavior at canteen','Availability of vegetarian / special diet options','Drinking water at canteen','Canteen infrastructure and maintenance','Food safety and expiry concerns'] },
  { id: 'infrastructure',label: 'Campus Infrastructure & Maintenance',     icon: '🏗️', color: '#8b5cf6', isSensitive: false, sortOrder: 5,
    description: 'Buildings, classrooms, electrical, civil maintenance',
    subcategories: ['Classroom furniture and seating','Projector, screen and AV equipment','Electrical issues — lights, fans, sockets','Building structure and civil maintenance','Painting, walls and aesthetics','Campus roads and walkways','Parking facilities','Ramps, accessibility and differently-abled facilities','Security infrastructure — CCTV, gates','Drainage and waterlogging','Pest control','Construction noise and disruption','Common area maintenance','Notice boards and signage','Garbage collection and waste management'] },
  { id: 'toilets',      label: 'Toilets & Sanitation',                     icon: '🚿', color: '#06b6d4', isSensitive: false, sortOrder: 6,
    description: 'Cleanliness, water, locks, hygiene supplies',
    subcategories: ['Cleanliness and hygiene of toilets','Water availability in toilets','Broken or missing locks and doors','Hand wash and soap availability','Sanitary bin and hygiene supplies','Lighting in toilet blocks','Exhaust and ventilation','Damaged tiles or fittings','Frequency of cleaning','Separate / adequate facilities for differently-abled','Toilet near specific location (hostel/lab/block)','Reporting urgent maintenance need'] },
  { id: 'transport',    label: 'Transport & College Buses',                icon: '🚌', color: '#f97316', isSensitive: false, sortOrder: 7,
    description: 'Bus timing, routes, driver behavior, safety',
    subcategories: ['Bus timing — late arrival or departure','Bus route — coverage and stops','Bus overcrowding','Bus cleanliness and condition','Driver behavior and safety','Conductor behavior','Bus breakdown or non-availability','Bus pass and fee issues','New route request','Luggage and boarding issues','Night transport availability','Safety during travel','GPS / tracking of buses'] },
  { id: 'sports',       label: 'Physical Education (PT) & Sports',         icon: '⚽', color: '#84cc16', isSensitive: false, sortOrder: 8,
    description: 'Grounds, equipment, PT schedules, sports events',
    subcategories: ['Sports ground condition and maintenance','Sports equipment availability','Gym equipment and facilities','PT class schedule and attendance','Sports event organization','Selection and participation fairness','Coaching and PT staff support','Indoor sports facilities','Outdoor activity areas','Sports kit and uniform','Injury reporting and first aid','Sports club management'] },
  { id: 'library',      label: 'Library & Learning Resources',             icon: '📚', color: '#a855f7', isSensitive: false, sortOrder: 9,
    description: 'Books, e-resources, reading rooms, timing',
    subcategories: ['Book availability and procurement','E-resources and digital library access','Reading room facilities and seating','Library timing and holidays','Book issue / return process','Library staff support','Noise and discipline in library','Computer access in library','Magazines, journals and periodicals','Fine or penalty issues','Reservation and renewal system'] },
  { id: 'xerox',        label: 'Xerox, Stationery & Campus Shops',         icon: '🖨️', color: '#ec4899', isSensitive: false, sortOrder: 10,
    description: 'Xerox pricing, quality, stationery availability',
    subcategories: ['Xerox overpricing or billing dispute','Xerox print quality issues','Stationery availability and pricing','Campus shop overcharging','Token or queue management','Timing and availability of services','Staff behavior at campus shops','Mobile recharge / banking kiosk issues','ID card, certificate printing services','Suggestion for new campus shop service'] },
  { id: 'it_services',  label: 'IT, Wi-Fi & Digital Services',             icon: '📡', color: '#14b8a6', isSensitive: false, sortOrder: 11,
    description: 'Campus Wi-Fi, ERP portal, student systems',
    subcategories: ['Campus Wi-Fi connectivity','Wi-Fi speed and bandwidth','ERP / student portal login issues','Online attendance and marks access','Email and institutional ID issues','CCTV and campus surveillance','Online fee payment issues','Learning management system (LMS)','Computer lab internet access','Network downtime and outages','Cybersecurity concern','Digital notice board or display issues'] },
  { id: 'exams',        label: 'Examinations & Academic Administration',   icon: '📝', color: '#ef4444', isSensitive: false, sortOrder: 12,
    description: 'Internal marks, hall tickets, results, exam issues',
    subcategories: ['Internal assessment marks — incorrect or missing','Hall ticket not issued or error in hall ticket','Examination schedule and timetable','Examination hall conditions','Result declaration delay','Result revaluation or photocopy request','Arrear exam procedures','Absentee or malpractice notice dispute','Supplementary exam issues','Anna University exam registration','Grade or mark sheet errors','Academic calendar and schedule conflicts'] },
  { id: 'fees',         label: 'Fees, Scholarships & Finance',             icon: '💰', color: '#f59e0b', isSensitive: false, sortOrder: 13,
    description: 'Fee receipts, scholarship status, financial issues',
    subcategories: ['Fee receipt not issued or incorrect','Excess fee collection dispute','Scholarship application support','Scholarship payment delay or non-receipt','BC / MBC / SC / ST scholarship issues','Government scholarship portal issues','Fine or penalty dispute','Caution deposit refund','Fee waiver or installment request','Financial hardship support request'] },
  { id: 'welfare',      label: 'Student Welfare & Health',                 icon: '🏥', color: '#22c55e', isSensitive: false, sortOrder: 14,
    description: 'Medical, counseling, mental health, welfare schemes',
    subcategories: ['Medical room or first aid availability','Campus doctor or nurse availability','Mental health and counseling support','Student welfare scheme access','Differently-abled student support','Women cell and women welfare','Anti-ragging cell contact','Grievance redressal officer contact','Student insurance issues'] },
  { id: 'safety',       label: 'Safety, Respect & Student Protection',     icon: '🛡️', color: '#dc2626', isSensitive: true,  sortOrder: 15,
    sensitiveNote: 'Reports submitted here are visible ONLY to authorized safety officers and designated committees.',
    description: 'Ragging, harassment, bullying, discrimination, threats — confidential reporting',
    subcategories: ['Ragging — physical, verbal, or psychological','Bullying and intimidation','Physical harm or assault','Sexual harassment (POSH Act)','Cyberbullying or online harassment','Stalking — physical or digital','Discrimination — caste, gender, religion, disability','Threats and coercion','Retaliation for reporting an issue','Unsafe campus condition or immediate danger','Privacy violation or personal data misuse','Other safety or protection concern'] },
  { id: 'faculty_admin',label: 'Faculty, Staff & Department Administration',icon: '👨‍🏫', color: '#7c3aed', isSensitive: false, sortOrder: 16,
    description: 'Faculty conduct, department admin, support staff',
    subcategories: ['Faculty academic conduct','Faculty attendance and availability','Faculty communication and responsiveness','Department administrative staff behavior','Support staff conduct','Office hours and accessibility','Bias or favoritism concern (non-safety)','Department event organization','Faculty mentoring and guidance'] },
  { id: 'placement',    label: 'Placement, Internship & Career Services',  icon: '💼', color: '#0891b2', isSensitive: false, sortOrder: 17,
    description: 'Campus placement, internships, career guidance',
    subcategories: ['Placement drive organization and communication','Eligibility criteria for placement','Internship opportunity and support','Resume and interview preparation support','Career guidance and counseling','Placement cell responsiveness','Off-campus recruitment coordination','Salary / stipend dispute (internship)','Placement portal and registration issues'] },
  { id: 'environment',  label: 'Campus Environment & Sustainability',      icon: '🌿', color: '#16a34a', isSensitive: false, sortOrder: 18,
    description: 'Green campus, cleanliness, recycling, energy',
    subcategories: ['Campus cleanliness and littering','Tree cutting or green space damage','Recycling and waste segregation','Energy wastage — lights/fans left on','Water wastage','Noise pollution in campus','Air quality and dust','Stray animal management','Solar panels or sustainability initiatives','Campus beautification suggestion'] },
  { id: 'events',       label: 'Events, Clubs & Student Activities',       icon: '🎉', color: '#d97706', isSensitive: false, sortOrder: 19,
    description: 'Fests, clubs, student council, activities',
    subcategories: ['College fest or event organization','Student club activities and support','Student council election issues','Permission for student events','Inter-college competition participation','Cultural activity support','Technical event or hackathon','Budget or funding for student activities'] },
  { id: 'administration',label: 'Administration & General Services',       icon: '🏛️', color: '#6b7280', isSensitive: false, sortOrder: 20,
    description: 'Office, certificates, general administration',
    subcategories: ['Bonafide or study certificate issues','Transfer certificate or migration','No-objection certificate (NOC)','College ID card issues','Administrative staff responsiveness','Attendance shortage concern','Leave application process','Gate pass and campus exit rules','Dress code or discipline notice dispute','General suggestion or feedback'] },
];

const ROUTING = [
  { categoryId: 'hostel',        categoryLabel: 'Hostel & Residential Facilities',        responsibleOffice: 'Hostel Maintenance Office',            backupOffice: 'Dean of Students', escalationPath: [{level:1,office:'Hostel Warden',afterDays:3},{level:2,office:'Chief Warden',afterDays:7},{level:3,office:'Principal',afterDays:14}] },
  { categoryId: 'academics',     categoryLabel: 'All Academic Departments',               responsibleOffice: 'Relevant Department HOD',              backupOffice: 'Academic Dean', escalationPath: [{level:1,office:'Department HOD',afterDays:3},{level:2,office:'Academic Dean',afterDays:7},{level:3,office:'Principal',afterDays:14}] },
  { categoryId: 'labs',          categoryLabel: 'Laboratories & Workshops',               responsibleOffice: 'Lab In-charge / Department HOD',       backupOffice: 'Academic Dean', escalationPath: [{level:1,office:'Lab In-charge',afterDays:3},{level:2,office:'Department HOD',afterDays:7}] },
  { categoryId: 'canteen',       categoryLabel: 'Canteen & Food Services',                responsibleOffice: 'Canteen Management',                   backupOffice: 'College Administration Office', escalationPath: [{level:1,office:'Canteen Manager',afterDays:2},{level:2,office:'Administration Office',afterDays:5}] },
  { categoryId: 'infrastructure',categoryLabel: 'Campus Infrastructure & Maintenance',    responsibleOffice: 'Facilities & Maintenance Department',   backupOffice: 'College Administration Office', escalationPath: [{level:1,office:'Maintenance Supervisor',afterDays:3},{level:2,office:'Estate Officer',afterDays:7}] },
  { categoryId: 'toilets',       categoryLabel: 'Toilets & Sanitation',                   responsibleOffice: 'Facilities & Maintenance Department',   backupOffice: 'College Administration Office', escalationPath: [{level:1,office:'Maintenance Supervisor',afterDays:1},{level:2,office:'Estate Officer',afterDays:3}] },
  { categoryId: 'transport',     categoryLabel: 'Transport & College Buses',              responsibleOffice: 'Transport Office',                     backupOffice: 'College Administration Office', escalationPath: [{level:1,office:'Transport Officer',afterDays:2},{level:2,office:'Administration Office',afterDays:5}] },
  { categoryId: 'sports',        categoryLabel: 'Physical Education (PT) & Sports',       responsibleOffice: 'Physical Education Department',        backupOffice: 'Dean of Students', escalationPath: [{level:1,office:'PE Director',afterDays:3},{level:2,office:'Dean of Students',afterDays:7}] },
  { categoryId: 'library',       categoryLabel: 'Library & Learning Resources',           responsibleOffice: 'Librarian',                            backupOffice: 'Academic Dean', escalationPath: [{level:1,office:'Head Librarian',afterDays:3},{level:2,office:'Academic Dean',afterDays:7}] },
  { categoryId: 'xerox',         categoryLabel: 'Xerox, Stationery & Campus Shops',       responsibleOffice: 'Campus Administration',                backupOffice: 'College Administration Office', escalationPath: [{level:1,office:'Campus Coordinator',afterDays:2},{level:2,office:'Administration Office',afterDays:5}] },
  { categoryId: 'it_services',   categoryLabel: 'IT, Wi-Fi & Digital Services',           responsibleOffice: 'IT Department',                        backupOffice: 'College Administration Office', escalationPath: [{level:1,office:'IT Manager',afterDays:2},{level:2,office:'Administration Office',afterDays:5}] },
  { categoryId: 'exams',         categoryLabel: 'Examinations & Academic Administration', responsibleOffice: 'Examinations Cell / COE',              backupOffice: 'Academic Dean', escalationPath: [{level:1,office:'Examinations Cell',afterDays:3},{level:2,office:'COE',afterDays:7},{level:3,office:'Principal',afterDays:14}] },
  { categoryId: 'fees',          categoryLabel: 'Fees, Scholarships & Finance',           responsibleOffice: 'Accounts & Finance Office',            backupOffice: 'College Administration Office', escalationPath: [{level:1,office:'Accounts Officer',afterDays:5},{level:2,office:'Finance Head',afterDays:10}] },
  { categoryId: 'welfare',       categoryLabel: 'Student Welfare & Health',               responsibleOffice: 'Student Welfare Officer',              backupOffice: 'Dean of Students', escalationPath: [{level:1,office:'Student Welfare Officer',afterDays:3},{level:2,office:'Dean of Students',afterDays:7}] },
  { categoryId: 'safety',        categoryLabel: 'Safety, Respect & Student Protection',   responsibleOffice: 'Safety Review Committee (RESTRICTED)', backupOffice: 'Principal', isSensitive: true, restrictedToRoles: ['admin','grievance_officer'], escalationPath: [{level:1,office:'Designated Committee',afterDays:1},{level:2,office:'Principal',afterDays:3}] },
  { categoryId: 'faculty_admin', categoryLabel: 'Faculty, Staff & Department Administration', responsibleOffice: 'Relevant Department HOD / Principal', backupOffice: 'Academic Dean', escalationPath: [{level:1,office:'Department HOD',afterDays:3},{level:2,office:'Academic Dean',afterDays:7},{level:3,office:'Principal',afterDays:14}] },
  { categoryId: 'placement',     categoryLabel: 'Placement, Internship & Career Services',responsibleOffice: 'Placement Cell',                       backupOffice: 'Dean of Students', escalationPath: [{level:1,office:'Placement Officer',afterDays:3},{level:2,office:'Dean of Students',afterDays:7}] },
  { categoryId: 'environment',   categoryLabel: 'Campus Environment & Sustainability',    responsibleOffice: 'Facilities & Administration',          backupOffice: 'College Administration Office', escalationPath: [{level:1,office:'Estate Officer',afterDays:5},{level:2,office:'Principal',afterDays:14}] },
  { categoryId: 'events',        categoryLabel: 'Events, Clubs & Student Activities',     responsibleOffice: 'Student Affairs / Dean of Students',   backupOffice: 'Dean of Students', escalationPath: [{level:1,office:'Student Affairs',afterDays:3},{level:2,office:'Dean of Students',afterDays:7}] },
  { categoryId: 'administration',categoryLabel: 'Administration & General Services',      responsibleOffice: 'College Administration Office',        backupOffice: 'Principal', escalationPath: [{level:1,office:'Administrative Officer',afterDays:3},{level:2,office:'Principal',afterDays:7}] },
];

export async function seedCategories() {
  // Upsert categories
  for (const cat of CATEGORIES) {
    await Category.findOneAndUpdate({ id: cat.id }, cat, { upsert: true, new: true });
  }

  // Upsert routing rules
  for (const rule of ROUTING) {
    await RoutingRule.findOneAndUpdate({ categoryId: rule.categoryId }, rule, { upsert: true, new: true });
  }

  console.log(`✅ Seeded ${CATEGORIES.length} categories + ${ROUTING.length} routing rules`);
}

async function seed() {
  const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kcet_360_smartgrievance';
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.warn('⚠️ Atlas/Local MongoDB failed, using MongoMemoryServer...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }

  await seedCategories();
  await mongoose.disconnect();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch(err => { console.error(err); process.exit(1); });
}

