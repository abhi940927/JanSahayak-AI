# JanSahayak AI - Architecture Documentation

## 1. Executive Summary
JanSahayak AI is an enterprise-grade, AI-assisted public grievance redressal platform engineered for Indian and global smart governance. It provides a fault-tolerant, high-integrity bridge connecting citizens with civic authorities, incorporating natural language understanding, automated department routing, duplicate detection, and real-time SLA lifecycle management.

## 2. High-Level Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                                 CLIENT TIER                                     |
|  +---------------------------------------------------------------------------+  |
|  |                  React 18/19 Single Page Application                      |  |
|  |       (Vite, Tailwind CSS, Lucide React, Recharts, Context Providers)      |  |
|  +---------------------------------------------------------------------------+  |
|        |                                       |                                |
|        | (Supabase Auth / Realtime)            | (REST / Zod JSON)              |
|        v                                       v                                |
+-------------------------------------+  +----------------------------------------+
|           SUPABASE CLOUD            |  |             BACKEND TIER               |
|  +-------------------------------+  |  |  +----------------------------------+  |
|  |  PostgreSQL Database (RLS)    |  |  |  | Express.js Application Server    |  |
|  |  - 13 Relational Tables       |<-------| - Auth & Role Verification       |  |
|  |  - Row Level Security (RLS)   |  |  |  | - Business Validation (Zod)      |  |
|  |  - Auth.users & Profile sync  |  |  |  | - Complaint Lifecycle Controller|  |
|  |  - Triggers & Audit Trail     |  |  |  | - Audit Logging Engine           |  |
|  +-------------------------------+  |  |  +----------------------------------+  |
|  |  Supabase Storage (Evidence)  |  |                     |                     |
|  +-------------------------------+  |                     | (HTTP JSON)         |
|  |  Supabase Realtime Channel    |  |                     v                     |
|  +-------------------------------+  |  +----------------------------------------+
|                                     |  |            AI / ML SERVICE             |
|                                     |  |  +----------------------------------+  |
|                                     |  |  | Python FastAPI Microservice      |  |
|                                     |  |  | - Scikit-learn Classifier        |  |
|                                     |  |  | - Semantic Sentence Transformer  |  |
|                                     |  |  | - Priority / Safety Assessor     |  |
|                                     |  |  | - Duplicate Match Analyzer       |  |
|                                     |  |  | - LLM Summarizer (with fallback) |  |
|                                     |  |  +----------------------------------+  |
+-------------------------------------+  +----------------------------------------+
```

## 3. Component Breakdown

### Frontend (React + Vite)
- **Role-based views**: Distinct, secured dashboards for Citizens, Officers, Department Admins, and Super Admins.
- **Form Engine**: Multi-step, accessible complaint submission with geolocation tagging, dynamic AI category suggestion preview, and file upload validation.
- **Live Status Tracker**: Visual timeline reflecting status transitions (`submitted` -> `verified` -> `assigned` -> `in_progress` -> `resolved` -> `closed`).
- **Telemetry & Dashboards**: Recharts visualizations for SLA compliance, department load, and resolution benchmarks.

### Backend (Node.js + Express)
- **Security & Authorization**: Verifies Supabase JWT tokens, asserts DB-level roles, and applies strict CORS and rate limiting.
- **Validation**: Zod schema validation across all write endpoints.
- **Workflow State Machine**: Strictly enforces permissible status transitions. Only assigned officers or authorized admins can transition complaint state.
- **Audit Logging**: Every state change or re-assignment writes an immutable entry into `complaint_history` and `audit_logs`.

### Database (PostgreSQL + Supabase)
- **Row Level Security (RLS)**: Enforced directly on PostgreSQL tables. Citizens are locked to their own records; officers are restricted by assignment or department jurisdiction.
- **Data Integrity**: Foreign keys with cascading rules and check constraints.

### AI Service (Python + FastAPI)
- **Categorization**: NLP pipeline using TF-IDF + Multinomial Logistic Regression/SGD trained on civic complaint corpora.
- **Semantic Duplication**: Cosine similarity using `all-MiniLM-L6-v2` embeddings, combined with spatial distance (Haversine formula) and temporal window constraints.
- **Priority Recommendation**: Heuristic + keyword safety matrix evaluating safety hazards, scale of impact, and vulnerable infrastructure.
- **Summarization**: Structured JSON extraction for officers summarizing root cause and suggested immediate intervention.
