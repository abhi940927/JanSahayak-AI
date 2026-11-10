# JANSAHAYAK AI – SUPABASE DATABASE IMPLEMENTATION GUIDE
**Document Reference:** `docs/SUPABASE_DATABASE_IMPLEMENTATION.md`  
**System Architecture:** Production Multi-Role Civic Grievance Redressal System  
**Database Engine:** PostgreSQL 15+ (Supabase Managed Engine)  
**Schema Version:** 2.0.0

---

## 1. Architectural Overview & Entity Schema

JanSahayak AI integrates Supabase PostgreSQL as its authoritative state store. The architecture provides multi-role role-based access control (RBAC), end-to-end grievance lifecycle management, immutable audit logging, and strict Row Level Security (RLS).

### Entity Relationship Architecture (14 Core Tables)

```
┌────────────────────────────────────────────────────────┐
│                   auth.users (UUID)                    │
└──────────────────────────┬─────────────────────────────┘
                           │ 1:1
┌──────────────────────────▼─────────────────────────────┐
│                    public.profiles                     │
│  - id (UUID PK -> auth.users)                          │
│  - full_name, email, phone_number, dob, avatar_url     │
│  - roles TEXT[], role user_role, designation           │
└──────────────┬──────────────────────────┬──────────────┘
               │ 1:N                      │ 1:N
┌──────────────▼─────────────┐ ┌──────────▼──────────────┐
│     public.user_roles      │ │    public.complaints    │
│  - user_id (FK -> profiles)│ │  - tracking_number (UQ) │
│  - role (user_role)        │ │  - citizen_id (FK)      │
│  - department_id (FK)      │ │  - department_id (FK)   │
│  - assigned_by (FK)        │ │  - category_id (FK)     │
└──────────────┬─────────────┘ │  - status, priority     │
               │               │  - coordinates, SLA     │
┌──────────────▼─────────────┐ └──────────┬──────────────┘
│    public.departments      │            │
│  - id, name, code, sla     │            │ 1:N
└──────────────┬─────────────┘            ├──────────────────────────┐
               │ 1:N                      │                          │
┌──────────────▼─────────────┐ ┌──────────▼──────────┐    ┌──────────▼──────────┐
│     public.categories      │ │complaint_assignments│    │  complaint_history  │
│  - id, dept_id, name, sla  │ │ - officer_id (FK)   │    │  - from_status      │
└────────────────────────────┘ │ - assigned_by (FK)   │    │  - to_status        │
                               └─────────────────────┘    │  - performed_by     │
                                                          └─────────────────────┘
```

---

## 2. All 14 Database Entities Specification

| # | Entity Name | Primary Key | Foreign Keys & Relationships | Purpose |
| :- | :--- | :--- | :--- | :--- |
| 1 | `profiles` | `id UUID` | `id -> auth.users(id)` | Personal identity, verified contact details, date of birth, avatar. |
| 2 | `user_roles` | `id UUID` | `user_id -> profiles`, `dept_id -> departments` | Multi-role assignment (single UUID with multiple role grants). |
| 3 | `departments` | `id UUID` | Self-contained (`name`, `code` unique) | Municipal & state administrative departments (MCD, PWD, EPD, DJB, etc.). |
| 4 | `categories` | `id UUID` | `department_id -> departments(id)` | Civic issue categorizations, default priorities, and SLA deadlines. |
| 5 | `complaints` | `id UUID` | `citizen_id -> profiles`, `department_id`, `category_id` | Core grievance entity tracking status, location, SLA, and lifecycle. |
| 6 | `complaint_assignments` | `id UUID` | `complaint_id`, `officer_id`, `assigned_by` | Records officer dispatch, field team delegation, and acceptance. |
| 7 | `complaint_history` | `id UUID` | `complaint_id`, `performed_by -> profiles` | Immutable timeline audit log triggered on every status transition. |
| 8 | `complaint_attachments` | `id UUID` | `complaint_id`, `uploaded_by -> profiles` | Photos, inspection evidence, PDFs, and officer resolution proof. |
| 9 | `ai_predictions` | `id UUID` | `complaint_id`, `predicted_dept_id`, `predicted_cat_id` | AI classification confidence score, sentiment, priority, and human review. |
| 10 | `duplicate_matches` | `id UUID` | `primary_id -> complaints`, `duplicate_id -> complaints` | Spatial-temporal clustering and semantic duplicate detection. |
| 11 | `escalations` | `id UUID` | `complaint_id`, `handled_by -> profiles` | Automated SLA breach alerts and hierarchical administrative escalation. |
| 12 | `notifications` | `id UUID` | `user_id -> profiles`, `complaint_id` | Real-time status update alerts and assignment notices. |
| 13 | `feedback` | `id UUID` | `complaint_id (UQ)`, `citizen_id -> profiles` | Post-resolution citizen rating (1–5) and satisfaction remarks. |
| 14 | `audit_logs` | `id UUID` | `actor_id -> profiles` | Security audit trail recording sensitive administrative operations. |

---

## 3. Dynamic User Profiles & Multi-Role Architecture

### Zero Hardcoding Guarantee
- **No static identities:** All full names, dates of birth, contact details, emails, and avatars are dynamically written and retrieved from the database.
- **Dynamic Multi-Role Support:** A single authenticated UUID in `auth.users` can have multiple authorized roles (e.g. `department_admin` for PWD and `super_admin` system-wide).
- **Controlled Admin Provisioning:** Privileged roles are granted exclusively through administrative role creation or invitation redemption (`admin_invitations` table), preventing public elevation.

---

## 4. Complaint Workflow Lifecycle

The schema supports all 11 grievance workflow stages:

```
[submitted] ──► [under_review] ──► [assigned] ──► [in_progress]
     │                                                    │
     ├──────────────────► [pending_information] ◄────────┤
     │                                                    │
     ▼                                                    ▼
 [rejected]                                   [resolution_submitted]
                                                          │
                                                          ▼
  [reopened] ◄────────────────────────────────────── [resolved]
                                                          │
                                                          ▼
                                                       [closed]
                                                          ▲
                                                          │
                                                    [escalated] (Any active state upon SLA breach)
```

---

## 5. Storage Buckets Configuration

### 5.1 `profile-photos`
- **Bucket ID:** `profile-photos`
- **Public Visibility:** `true` (avatar image delivery)
- **Size Limit:** 5 MB (`5242880` bytes)
- **Allowed MIME Types:** `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`
- **Path Structure:** `{user_id}/{filename}`
- **Security Rule:** Users can upload/modify files only in their own folder (`(auth.uid())::text = (storage.foldername(name))[1]`).

### 5.2 `complaint-attachments`
- **Bucket ID:** `complaint-attachments`
- **Public Visibility:** `false` (Private & Authenticated)
- **Size Limit:** 15 MB (`15728640` bytes)
- **Allowed MIME Types:** `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `application/pdf`, `image/heic`
- **Path Structure:** `complaints/{complaint_id}/{filename}`
- **Security Rule:** Accessible strictly by complaint citizen owner, assigned field officer, department administrator, and super admin.

---

## 6. Migration Application & Deployment Instructions

### Option A: Using Supabase Dashboard (SQL Editor)
1. Open the [Supabase Dashboard](https://app.supabase.com).
2. Select your JanSahayak AI project.
3. Navigate to **SQL Editor**.
4. Execute the migration scripts in sequential order:
   - Run `supabase/migrations/001_initial_schema.sql` (if starting fresh).
   - Run `supabase/migrations/002_multi_role_and_workflow_expansion.sql`.
   - Run `supabase/migrations/003_storage_buckets_and_rls.sql`.
   - Run `supabase/migrations/004_complete_rls_policies.sql`.
   - Run `supabase/migrations/005_automation_triggers_and_indexes.sql`.
   - Run `supabase/seed.sql` (to seed departments, categories, and test accounts).

### Option B: Using Supabase CLI
```bash
# Link project
supabase link --project-ref your-project-id

# Apply migrations
supabase db push

# Seed data
supabase db reset --linked
```

### Option C: Automated Environment Verification
Run the end-to-end integration test suite:
```bash
node backend/test_supabase_integration.js
```
Expected output:
```
🎉 ALL 50/50 SUPABASE DATABASE INTEGRATION TESTS PASSED!
```
