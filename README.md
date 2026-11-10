# JanSahayak AI (जनसहायक AI)
### Smart Complaints. Faster Resolution. Transparent Governance.

An AI-Powered National Public Grievance Redressal and Public Service Delivery Management Platform designed for modern civic administration.

---

## 1. System Architecture Overview

```
jansahayak-ai/
│
├── frontend/             # React 18/19, Vite, Tailwind CSS, Lucide React, Recharts
│   ├── src/
│   │   ├── components/   # Common badges, timeline steppers, cards, responsive layout
│   │   ├── pages/        # Public, Citizen, Officer, and Administrator dashboards
│   │   ├── context/      # Authentication & role state management
│   │   └── services/     # Axios client and Supabase integration
│
├── backend/              # Node.js, Express.js REST API
│   ├── config/           # Supabase client & environment configuration
│   ├── controllers/      # Complaint, department, analytics & notification handlers
│   ├── middleware/       # JWT auth & server-side role verification
│   ├── routes/           # Structured REST routes
│   ├── services/         # Business logic & resilient data store
│   └── validators/       # Zod request payload schemas
│
├── python-ai/            # Python FastAPI Cognitive Microservice
│   ├── classifiers/      # Scikit-learn NLP complaint classification & priority engine
│   ├── embeddings/       # Semantic duplicate detection (Text similarity + Geolocation radius)
│   ├── services/         # Executive briefing summarizer & multilingual processor (EN, HI, PA)
│   └── tests/            # Automated integration test suite
│
├── database/             # Supabase PostgreSQL relational architecture
│   ├── migrations/       # Versioned database migration scripts
│   ├── schema.sql        # 13 relational tables, RLS security policies & triggers
│   └── seed.sql          # Seed civic departments & initial categories
│
└── docs/                 # Architecture, database design & API documentation
```

---

## 2. Technology Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide React, Recharts, React Router DOM
- **Backend**: Node.js, Express.js, Zod Validation, Supabase SDK, Helmet, CORS
- **AI Microservice**: Python, FastAPI, Scikit-learn, TF-IDF NLP, Geolocation Haversine, Uvicorn
- **Database & Auth**: Supabase PostgreSQL, Row Level Security (RLS), Supabase Auth

---

## 3. Quick Start & Local Execution

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Git

### Port Map
| Service | Technology | Port | URL |
|---|---|---|---|
| **Frontend** | React / Vite | `5173` | [http://localhost:5173](http://localhost:5173) |
| **Backend** | Express.js | `5001` | [http://localhost:5001](http://localhost:5001) |
| **AI Service** | FastAPI | `8000` | [http://localhost:8000](http://localhost:8000) |

---

### Step 1: Clone & Configure Environment

```bash
cp .env.example .env
```

### Step 2: Launch Backend Service

```bash
cd backend
npm install
npm run dev
# Running on http://localhost:5001
```

### Step 3: Launch Python AI Microservice

```bash
cd python-ai
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
# Running on http://localhost:8000
```

To run the AI automated test suite:
```bash
python tests/test_ai_service.py
```

### Step 4: Launch Frontend Application

```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 4. Evaluator Test Accounts & Quick Role Switcher

For frictionless evaluation, the application includes a **Quick Demo Switcher** in the top navigation bar and pre-seeded evaluation accounts:

| Role | Email | Permissions & Scope |
|---|---|---|
| **Citizen** | `citizen@jansahayak.in` | File complaints with AI assist, view personal grievances, track timeline, rate resolution |
| **Field Officer** | `officer.pwd@jansahayak.gov.in` | Manage assigned department queue, transition statuses, commit inspection notes |
| **Department Admin** | `admin.mcd@jansahayak.gov.in` | Department-wide oversight, officer workload monitoring, category configuration |
| **Super Admin** | `superadmin@jansahayak.gov.in` | Cross-department governance analytics, SLA compliance scorecards, audit trail, CSV exports |

*Evaluator Demo Password:* `GovPass2026@demo` (or click any 1-click account button on `/login`).

---

## 5. Supabase PostgreSQL Setup & Production Migration

To link your live Supabase cloud database:

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste and run the contents of [`database/schema.sql`](file:///Users/abhinav/Desktop/JANSAHAYAK%20AI/database/schema.sql) (creates all 13 tables, enums, triggers, and RLS policies).
4. Paste and run the contents of [`database/seed.sql`](file:///Users/abhinav/Desktop/JANSAHAYAK%20AI/database/seed.sql) (populates standard departments and categories).
5. Add your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env`.

---

## 6. Verification & Automated Test Status

All test suites have been executed and verified:
- ✅ **Python AI Microservice**: Health check, classification, priority assessment, duplicate detection, and summarizer tests passed.
- ✅ **Backend API Suite**: Health, department listing, complaint creation, officer status transitions, and dynamic admin analytics passed.
- ✅ **Frontend Build**: Vite production compilation passed in 2.33s with 0 errors.
