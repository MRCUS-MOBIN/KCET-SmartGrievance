# 🛡️ KCET SmartGrievance — Student Complaint Management System

> **NLP-powered · Anonymous option · Department-wise routing · Multi-role dashboard**

A full-stack prototype campus grievance management system for Kamaraj College of Engineering and Technology. Built for an academic NLP capstone project.

---

## 🚀 Quick Start (3 Terminals)

### Prerequisites
- **Node.js** ≥ 18
- **MongoDB** running locally (`mongod`) or a MongoDB Atlas URI
- **Python** ≥ 3.9 with pip (for NLP service, optional)

---

### Terminal 1 — Backend API

```bash
cd backend
npm install
# Configure environment
cp .env.example .env   # then edit .env with your settings
node server.js
```

Backend runs at **http://localhost:5000**

---

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

---

### Terminal 3 — NLP Service (optional)

```bash
cd nlp-service
pip install -r requirements.txt
# Train the model first (one-time):
python train.py
# Then start the service:
uvicorn main:app --reload --port 8001
```

NLP service runs at **http://localhost:8001**

> **Without the NLP service:** complaints are still saved. They will be flagged as `needsHumanReview: true` for staff manual routing.

---

## ⚙️ Environment Variables (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Backend server port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/kcet_360_smartgrievance` | MongoDB connection string |
| `JWT_SECRET` | *(required — change before deploy)* | Secret key for signing JWT tokens |
| `NLP_URL` | `http://127.0.0.1:8001` | URL of the NLP FastAPI service |
| `UPLOAD_DIR` | `uploads` | Directory for complaint attachment files |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |

---

## 🎯 Demo Credentials

Since this is a fresh install, create accounts via the API or seeder script.

### Create an Admin account (via curl):
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@kcet.ac.in","password":"Admin@123","role":"admin"}'
```

### Create a Staff account:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Staff Member","email":"staff@kcet.ac.in","password":"Staff@123","role":"staff"}'
```

### Student accounts are created via the UI:
Navigate to **http://localhost:5173/student-login** → "Create Account" tab

---

## 📁 Project Structure

```
KCET_SmartGrievance_Starter/
├── backend/
│   ├── models/
│   │   ├── User.js            # User schema (student + staff)
│   │   ├── Complaint.js       # Complaint schema (with feedback, adminResponse)
│   │   ├── Category.js        # Dynamic categories
│   │   ├── Notification.js    # Notification schema
│   │   └── RoutingRule.js     # Routing rules for departments
│   ├── routes/
│   │   ├── auth.js            # Login, student register, profile update
│   │   ├── complaints.js      # Submit, track, manage, feedback
│   │   ├── analytics.js       # Dashboard analytics aggregations
│   │   ├── safety.js          # Confidential safety cases
│   │   ├── notifications.js   # Notification CRUD
│   │   ├── categories.js      # Category management
│   │   └── routing.js         # Smart routing rules
│   ├── middleware/
│   │   ├── auth.js            # requireAuth + optionalAuth
│   │   ├── role.js            # requireRole()
│   │   └── upload.js          # Multer file uploads
│   ├── server.js              # Express entry point
│   └── .env                   # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx     # Home with hero, categories, NLP demo
│   │   │   ├── StudentLogin.jsx    # Student login + registration (tabbed)
│   │   │   ├── LoginPage.jsx       # Staff-only login
│   │   │   ├── StudentDashboard.jsx # Complaint history + stat cards
│   │   │   ├── SubmitComplaint.jsx  # 3-step complaint form
│   │   │   ├── TrackComplaint.jsx   # Visual timeline + feedback
│   │   │   ├── AdminDashboard.jsx   # Admin analytics + complaint mgmt
│   │   │   ├── StaffDashboard.jsx   # Staff view + status updates
│   │   │   ├── SafetyReport.jsx     # Confidential safety reporting
│   │   │   ├── ProfilePage.jsx      # Account profile + password change
│   │   │   ├── NotificationCenter.jsx # Notifications inbox
│   │   │   ├── HelpSupport.jsx      # FAQ + contact info
│   │   │   └── PrivacyPolicy.jsx    # Data handling policy
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Responsive navbar with notification bell
│   │   │   ├── StatusBadge.jsx      # Colored status pill
│   │   │   ├── ComplaintCard.jsx    # Reusable complaint card
│   │   │   ├── AnalyticsChart.jsx   # Recharts wrappers
│   │   │   ├── NLPPreview.jsx       # Real-time NLP prediction display
│   │   │   ├── GroupComplaintPanel.jsx
│   │   │   └── EscalationTimeline.jsx
│   │   ├── data/
│   │   │   └── categories.js        # 20 complaint categories + subcategories
│   │   ├── styles.css               # Full design system
│   │   ├── App.jsx                  # Router + ProtectedRoute
│   │   └── main.jsx                 # React entry point
│   └── index.html
│
├── nlp-service/
│   ├── main.py                # FastAPI NLP service
│   ├── train.py               # Model training script
│   └── data/
│       └── training_data.json # Training dataset
│
└── README.md                  # This file
```

---

## 🔑 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | None | Staff login |
| POST | `/api/auth/student/login` | None | Student login (email or register number) |
| POST | `/api/auth/student/register` | None | Student registration |
| GET | `/api/auth/me` | JWT | Get current user profile |
| PATCH | `/api/auth/profile` | JWT | Update profile |
| PATCH | `/api/auth/change-password` | JWT | Change password |

### Complaints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/complaints` | None | Submit complaint (public) |
| GET | `/api/complaints/public-stats` | None | Aggregate stats (no PII) |
| GET | `/api/complaints/track/:id` | None | Track by Tracking ID |
| GET | `/api/complaints` | JWT (staff+) | List complaints |
| PATCH | `/api/complaints/:id/status` | JWT (staff+) | Update status |
| PUT | `/api/complaints/:id/assign` | JWT (staff+) | Assign department |
| POST | `/api/complaints/:id/response` | JWT (staff+) | Post admin response |
| POST | `/api/complaints/:id/support` | None | Upvote complaint |
| POST | `/api/complaints/:id/feedback` | None | Submit resolution rating |

### Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | Optional JWT | Get notifications |
| PATCH | `/api/notifications/:id/read` | Optional JWT | Mark one as read |
| PATCH | `/api/notifications/read-all` | Optional JWT | Mark all as read |

### Analytics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/summary` | JWT (staff+) | Overview stats |
| GET | `/api/analytics/by-category` | JWT (staff+) | Counts per category |
| GET | `/api/analytics/by-status` | JWT (staff+) | Counts per status |
| GET | `/api/analytics/trend` | JWT (staff+) | Daily submission trend |

---

## 🎨 Design System

The UI uses a custom CSS design system (no Tailwind) with:
- **Colors:** Navy blue/indigo primary (`#4f6ef7`), dark backgrounds, semantic status colors
- **Typography:** Inter + Syne (Google Fonts)
- **Components:** Cards, badges, buttons, form inputs, sidebar, notification bell — all defined in `styles.css`
- **Animations:** Fade-up, pulse, shimmer skeleton, gradient shift

---

## 🔒 Security Notes

- Passwords are bcrypt-hashed (cost factor 12)
- JWT tokens expire in 8 hours
- Role-based access control: students → `my-complaints`, staff → `/staff`, admin/grievance_officer → `/admin`
- Sensitive (safety) complaints are in a restricted DB query scope — regular staff cannot see them
- Anonymous submissions store no name/email — only a random tracking ID
- File uploads are stored locally; add cloud storage (S3) before any production deployment

---

## 📝 NLP Architecture

The NLP service uses:
- **TF-IDF vectorization** on complaint text
- **Logistic Regression** classifier trained on `training_data.json`
- Returns: `predictedCategory`, `confidence`, `isSensitive`, `suggestedDepartment`, `needsHumanReview`, `top3`

If confidence < threshold or category is sensitive, `needsHumanReview: true` is flagged for staff review.

---

## ⚠️ Disclaimer

This is a **prototype** developed for academic/demonstration purposes. It is **not** an official service of Kamaraj College of Engineering and Technology. Do not use it for actual complaints without proper authorization and security review.
