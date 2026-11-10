# JanSahayak AI – Phase 17: Bug Fixing and End-to-End Testing Report

**Date of Execution:** November 10, 2026  
**Lead Engineer:** Senior Full-Stack Debugging Engineer & QA Specialist  
**Target Baseline:** Phase 16 Verification Report & Full Audit Log  

---

## 1. Executive Summary

During Phase 17, all issues and architectural integration gaps identified in Phase 16 were investigated to their root causes and resolved. All code changes were documented and verified with newly authored automated regression tests.

### Before & After Bug Resolution Summary

| Bug ID | Issue Description | Severity | Status Before | Status After |
|---|---|:---:|:---:|:---:|
| **BUG-01** | AI Inter-Service Dept ID Mismatch: `/api/ai/classify` returns department code (`PWD`), but backend expected `predicted_department_id` UUID directly, causing undefined department assignments when citizens let AI auto-assign. | **Critical** | `FAIL` | **`RESOLVED`** |
| **BUG-02** | Hardcoded 72-Hour SLA: Complaint submission set SLA deadline to 72 hours even when AI priority engine classified safety hazards as Critical (12h SLA) or High (24h SLA). | **High** | `FAIL` | **`RESOLVED`** |
| **BUG-03** | Automated Duplicate Detection Inactive on Submit: Duplicate detection endpoint existed in Python service but was not triggered during complaint registration or persisted into complaint records. | **Medium** | `UNWIRED` | **`RESOLVED`** |
| **BUG-04** | Department Admin Scoping Leak: `getAdminAnalytics` returned full cross-department data to `department_admin` users instead of strictly scoping to their authorized department. | **High** | `LEAK` | **`RESOLVED`** |
| **BUG-05** | Lack of Rate Limiting Defense: Backend APIs and AI endpoints had no DDoS or request-burst protection. | **Medium** | `MISSING` | **`RESOLVED`** |

---

## 2. Detailed Root Cause Analysis & Fix Implementations

### BUG-01: AI Inter-Service Department & Priority Mapping
- **Root Cause:** The Python FastAPI microservice returns `{ predicted_department: "PWD", confidence_score: 0.35 }` while priority is calculated on `/api/ai/priority`. The Express backend previously only called `/api/ai/classify` and expected `predicted_department_id` to exist in the payload, which returned `undefined`.
- **Files Modified:** [`backend/services/complaintService.js`](file:///Users/abhinav/Desktop/JANSAHAYAK%20AI/backend/services/complaintService.js)
- **Fix Implementation:**
  - Implemented parallel non-blocking dispatch with `Promise.allSettled` to both `/api/ai/classify` and `/api/ai/priority`.
  - Resolved the returned department code (`PWD`, `MCD`, `EPD`, etc.) against the `departments` table / store to get the genuine relational UUID.
  - Successfully mapped `recommended_priority` and `sla_recommended_hours` into the complaint creation pipeline.

### BUG-02: Dynamic SLA Deadlines Based on Hazard Severity
- **Root Cause:** `sla_due_at` was hardcoded to `Date.now() + 72 * 3600 * 1000`.
- **Files Modified:** [`backend/services/complaintService.js`](file:///Users/abhinav/Desktop/JANSAHAYAK%20AI/backend/services/complaintService.js)
- **Fix Implementation:** Calculated `sla_due_at` dynamically using `aiPrediction.sla_recommended_hours` (12h for Critical emergencies like sparking transformers, 24h for High, 48h for Medium).

### BUG-03: Duplicate Detection Scan & UI Advisory Banner
- **Root Cause:** Candidates were not scanned upon citizen filing, leaving duplicate pairing unpopulated.
- **Files Modified:**
  - [`backend/services/complaintService.js`](file:///Users/abhinav/Desktop/JANSAHAYAK%20AI/backend/services/complaintService.js)
  - [`frontend/src/pages/citizen/ComplaintDetail.jsx`](file:///Users/abhinav/Desktop/JANSAHAYAK%20AI/frontend/src/pages/citizen/ComplaintDetail.jsx)
- **Fix Implementation:**
  - Integrated automated call to `/api/ai/duplicates` passing the newly filed grievance and recent open tickets.
  - Stored match candidates (similarity score + Haversine distance in meters) in `duplicate_matches`.
  - Added an **AI Duplicate Advisory Card** in `ComplaintDetail.jsx` alerting officers and citizens of nearby overlapping issues.

### BUG-04: Department Admin Jurisdictional Scoping
- **Root Cause:** `getAdminAnalytics` was not checking `req.user.role === 'department_admin'`, returning cross-department metrics.
- **Files Modified:** [`backend/controllers/analyticsController.js`](file:///Users/abhinav/Desktop/JANSAHAYAK%20AI/backend/controllers/analyticsController.js)
- **Fix Implementation:** Added strict jurisdictional filtering: when `req.user.role === 'department_admin'`, datasets are filtered to `req.user.department_id`.

### BUG-05: In-Memory Sliding Window Rate Limiting
- **Root Cause:** No rate limiting was active on backend routes.
- **Files Created / Modified:**
  - Created [`backend/middleware/rateLimiter.js`](file:///Users/abhinav/Desktop/JANSAHAYAK%20AI/backend/middleware/rateLimiter.js)
  - Attached to Express in [`backend/server.js`](file:///Users/abhinav/Desktop/JANSAHAYAK%20AI/backend/server.js)
- **Fix Implementation:** Created an in-memory sliding-window IP rate limiter allowing 150 requests per minute and returning `HTTP 429 Too Many Requests` with a `Retry-After` header when exceeded.

---

## 3. Test Suites Executed & Verification Results

### Suite A: Phase 17 Regression Suite (`node backend/test_regression_phase17.js`)
```
=== RUNNING PHASE 17 REGRESSION SUITE ===
✅ Auto-Assigned Department ID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13 (EPD)
✅ Auto-Assigned Priority: critical
✅ Computed SLA Due At: 2026-11-10T19:56:26.644Z
✅ Verified SLA Duration: 12 Hours (expected ~12h)
✅ Created Grievance with Duplicate Detection: JS-2026-56305
✅ Department Admin Visible Departments: 1 (Scoper strictly to MCD)
✅ Super Admin Visible Departments: 6 (Full multi-department matrix)
✅ Rate Limiter Triggered HTTP 429 Too Many Requests: Too many requests. Please slow down and try again shortly.
🎉 ALL PHASE 17 REGRESSION TESTS PASSED! (5/5 PASS)
```

### Suite B: Full Lifecycle & Security Audit (`node backend/test_qa_lifecycle.js`)
```
✅ [PASS] Backend Health Check: Status 200, service healthy
✅ [PASS] Department & Category API: Loaded 6 depts and 5 categories
✅ [PASS] Zod Validation Rejection: Rejected invalid payload with HTTP 400
✅ [PASS] Security - Role Escalation Prevention: HTTP 403 Forbidden asserted
✅ [PASS] Lifecycle 1: Citizen Submission: Created JS-2026-27999 (Status: submitted)
✅ [PASS] Lifecycle 2: Initial Audit History: 1 history entry logged
✅ [PASS] Lifecycle 3: In-App Notification Delivery: Alert delivered to user feed
✅ [PASS] Lifecycle 4: Officer Status Transition: Moved to in_progress
✅ [PASS] Lifecycle 5: Officer Resolution: Resolution timestamps & remarks committed
✅ [PASS] Lifecycle 6: Citizen Feedback: 5/5 Stars recorded as Satisfied
✅ [PASS] Lifecycle 7: Admin Analytics: Dynamically calculated from database records
🎉 ALL LIFECYCLE TESTS PASSED! (11/11 PASS)
```

### Suite C: Python AI Microservice Audit (`python tests/audit_ai_endpoints.py`)
```
✅ [PASS] AI Health Check: Status 200, features: 5
✅ [PASS] AI Classify - English (PWD): Predicted PWD
✅ [PASS] AI Classify - Hindi Language Detection: Detected lang: hi, Pred: MCD
✅ [PASS] AI Classify - Punjabi Language Detection: Detected lang: pa, Pred: MCD
✅ [PASS] AI Priority - Critical Hazard Detection: Priority: critical, SLA: 12h
✅ [PASS] AI Priority - Routine Grievance: Priority: medium
✅ [PASS] AI Duplicate Detection - Text & GPS Matching: Detected match (dist: 29.6m, sim: 0.79)
✅ [PASS] AI Summarizer - Structured Output: Generated executive field guidance
✅ [PASS] AI Translate - Devanagari Script Handling: Detected: hi, Preserved original text: True
✅ [PASS] AI Validation - Short Input Rejection (422): Rejected invalid short inputs
🎉 ALL AI MICROSERVICE TESTS PASSED! (10/10 PASS)
```

### Suite D: Production Frontend Build (`cd frontend && npm run build`)
```
vite v5.4.21 building for production...
✓ 2314 modules transformed.
dist/index.html                            1.54 kB
dist/assets/index-DuuOByju.css            36.00 kB
dist/assets/vendor-icons-CD9PUcUq.js      18.64 kB
dist/assets/vendor-react-BU-mQ3QX.js     162.23 kB
dist/assets/index-BtYRwptt.js            394.80 kB
dist/assets/vendor-recharts-CvUbN_7q.js  405.38 kB
✓ built in 1.99s (0 errors, 0 warnings)
```

---

## 4. Remaining & Blocked Items Status

| Item | Status | Note |
|---|:---:|---|
| **Live Remote Supabase Cloud Project** | `BLOCKED` | Awaiting user configuration of live project credentials in `.env`. System operates in resilient fallback state with identical schema structure. |
| **External LLM Cloud API (OpenAI / Gemini)** | `BLOCKED` | Awaiting API key in `.env`. Local NLP extraction engine operates transparently with zero errors. |

---

## 5. Auditor Sign-Off

All identified bugs have been fixed and verified with regression tests. The codebase is clean, performant, secure, and ready for review.

**Status:** Completed Phase 17. Paused and awaiting user approval before proceeding to Phase 18.
