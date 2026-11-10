# JanSahayak AI - Database Design Specification

## Entity Relationship Overview

The schema is built in PostgreSQL with 13 tables enforcing strict relational constraints:

1. **`departments`**: Government civic departments (e.g., PWD, MCD, EPD, DJB) with SLA targets.
2. **`profiles`**: User profiles extended from `auth.users`, storing role (`citizen`, `officer`, `department_admin`, `super_admin`), phone, designation, and department assignment.
3. **`categories`**: Specific issue classifications nested within departments.
4. **`complaints`**: Core grievance entities holding tracking numbers, locations (lat/lng, address), status, SLA deadlines, and citizen references.
5. **`complaint_assignments`**: Mapping of complaints to investigating officers.
6. **`complaint_history`**: Immutable lifecycle timeline logging every status transition, actor ID, and remarks.
7. **`complaint_attachments`**: Secure references to documents, pictures, and resolution proof.
8. **`ai_predictions`**: Persisted model recommendations (category, department, priority, confidence) with human review flags.
9. **`duplicate_matches`**: Pairs of potential duplicate complaints with text similarity scores and geographical distance in meters.
10. **`escalations`**: Records triggered when complaints breach SLA thresholds or fail multiple resolution reviews.
11. **`notifications`**: Targeted user alerts for status shifts, assignments, and escalations.
12. **`feedback`**: Citizen ratings (1-5 stars) and qualitative reviews upon complaint resolution.
13. **`audit_logs`**: System-wide administrative tracking recording who modified what, with old/new JSON payloads.

---

## State Transition Lifecycle

Complaints follow a strict finite state machine:
```
[submitted] ──> [verified] ──> [assigned] ──> [in_progress] ──> [under_review] ──> [resolved] ──> [closed]
     │              │               │               │
     v              v               v               v
 [rejected]     [rejected]     [escalated]      [reopened]
```
