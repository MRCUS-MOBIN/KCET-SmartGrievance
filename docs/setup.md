# KCET 360° SmartGrievance — Local Setup Guide

> This is a development prototype. Not an official KCET service.

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| Python | 3.9+ | https://python.org |
| MongoDB | 7+ | https://www.mongodb.com/try/download/community |

---

## 1 · MongoDB

Start MongoDB locally:
```bash
# Windows — run as service or:
mongod --dbpath "C:\data\db"
```
The default DB URI is `mongodb://127.0.0.1:27017/kcet_360_smartgrievance`.

---

## 2 · Backend

```bash
cd backend

# Copy env file and set JWT_SECRET
copy .env.example .env
# Edit .env — change JWT_SECRET to a long random string

# Install dependencies
npm install

# Seed all 20 categories + routing rules into MongoDB
npm run seed

# Start the API server (port 5000)
npm run dev
```

**Verify:** `http://localhost:5000/api/health` → `{ "ok": true }`

---

## 3 · NLP Service

```bash
cd nlp-service

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Train the model (creates models/pipeline.joblib)
python train.py
# Expected: Test Accuracy ≥ 60% on synthetic data

# Start the NLP API (port 8001)
uvicorn main:app --reload --port 8001
```

**Verify:** `http://localhost:8001/health` → `{ "ok": true, "modelLoaded": true }`

---

## 4 · Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (port 5173)
npm run dev
```

Open: **http://localhost:5173**

---

## 5 · Create Staff/Admin Accounts

Use the registration endpoint to create your first admin:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@kcet.ac.in","password":"Admin@1234","role":"admin","department":"Administration"}'
```

Then login at: http://localhost:5173/login

---

## Roles

| Role | Access |
|---|---|
| `student` | Submit complaints, track by ID (no login needed) |
| `staff` | View assigned complaints, update status (no sensitive access) |
| `admin` | Full dashboard, analytics, all complaints |
| `grievance_officer` | Admin + restricted safety cases queue |

---

## Services Summary

| Service | Port | Command |
|---|---|---|
| Frontend | 5173 | `npm run dev` (in /frontend) |
| Backend API | 5000 | `npm run dev` (in /backend) |
| NLP Service | 8001 | `uvicorn main:app --reload --port 8001` (in /nlp-service) |
| MongoDB | 27017 | `mongod` |

---

## Notes
- All category data is proposed — confirm with college administration before deployment.
- Sensitive/safety complaints are routed to a restricted queue visible only to `grievance_officer` and `admin` roles.
- NLP predictions require human review. Staff can always correct classifications.
- Anonymous identity is never exposed through the UI — enforced at the API level.
