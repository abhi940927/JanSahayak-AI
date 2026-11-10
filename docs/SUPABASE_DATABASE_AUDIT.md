# JANSAHAYAK AI – SUPABASE DATABASE AUDIT REPORT
**Document Reference:** `docs/SUPABASE_DATABASE_AUDIT.md`  
**Evaluation Target:** Supabase PostgreSQL Database, Auth, Storage, and RLS Policies  
**Audit Status:** Completed  
**Version:** 2.0.0 (Production Architecture Audit)

---

## 1. Executive Summary

JanSahayak AI is an AI-powered civic grievance redressal portal. The existing database architecture was inspected across all PostgreSQL tables, schemas, migrations (`database/schema.sql`, `database/migrations/001_initial_schema.sql`, `database/auth_enhancements.sql`, `database/seed.sql`), Supabase client configurations, and backend controllers.

The database contains 13 pre-existing core tables:
1. `departments`
2. `profiles`
3. `categories`
4. `complaints`
5. `complaint_assignments`
6. `complaint_history`
7. `complaint_attachments`
8. `ai_predictions`
9. `duplicate_matches`
10. `escalations`
11. `notifications`
12. `feedback`
13. `audit_logs`

This audit verifies all 13 existing tables, maps them against enterprise grievance redressal requirements, identifies schema gaps, assesses Row Level Security (RLS) vulnerabilities, analyzes multi-role management, evaluates storage bucket readiness, and specifies a non-destructive, idempotent migration roadmap.

---

## 2. Table-by-Table Technical Audit

### 2.1 `departments`
- **Primary Key:** `id UUID DEFAULT uuid_generate_v4()`
- **Key Columns:** `name VARCHAR(150) UNIQUE`, `code VARCHAR(20) UNIQUE`, `description TEXT`, `contact_email VARCHAR(255)`, `contact_phone VARCHAR(50)`, `sla_hours_default INTEGER DEFAULT 72`, `is_active BOOLEAN DEFAULT true`, `created_at`, `updated_at`.
- **Integrity Constraints:** Unique names and codes; non-null SLA configurations.
- **Audit Assessment:** **Robust & Compliant.** Correctly represents municipal and state departments (MCD, PWD, EPD, DJB, TPD, HFW).

### 2.2 `profiles` (Supabase `auth.users` Link)
- **Primary Key:** `id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
- **Existing Columns:** `email VARCHAR(255) UNIQUE`, `full_name VARCHAR(150)`, `phone_number VARCHAR(20)`, `role user_role DEFAULT 'citizen'`, `department_id UUID REFERENCES departments(id)`, `designation VARCHAR(100)`, `avatar_url TEXT`, `dob DATE`, `roles TEXT[] DEFAULT ARRAY['citizen']`, `is_active BOOLEAN`, `created_at`, `updated_at`.
- **Gaps Identified:**
  - Relies on single `role` enum and flat `roles` array without dedicated role assignment tracking.
  - Hardcoded email trigger found in `auth_enhancements.sql` (`abhisingh940927@gmail.com`) which directly violates the dynamic profile requirement and zero hardcoding principle.
- **Required Remediation:** Retain `profiles` for personal profile metadata; decouple multi-role authority to a dedicated `user_roles` relation; remove email hardcoding.

### 2.3 `categories`
- **Primary Key:** `id UUID DEFAULT uuid_generate_v4()`
- **Foreign Keys:** `department_id UUID REFERENCES departments(id) ON DELETE CASCADE`
- **Key Columns:** `name`, `code`, `description`, `default_priority complaint_priority`, `sla_hours`, `is_active`.
- **Unique Constraint:** `(department_id, name)`
- **Audit Assessment:** **Compliant.** Correctly establishes department-scoped grievance categories with individual SLAs.

### 2.4 `complaints`
- **Primary Key:** `id UUID DEFAULT uuid_generate_v4()`
- **Foreign Keys:** `citizen_id UUID REFERENCES profiles(id) RESTRICT`, `department_id UUID REFERENCES departments(id) RESTRICT`, `category_id UUID REFERENCES categories(id) SET NULL`.
- **Key Columns:** `tracking_number VARCHAR(30) UNIQUE`, `title`, `description`, `status complaint_status`, `priority complaint_priority`, `is_escalated`, `escalation_level`, `address`, `city`, `state`, `pincode`, `latitude`, `longitude`, `sla_due_at`, `resolved_at`, `closed_at`, `reopen_count`.
- **Gaps Identified:**
  - The existing `complaint_status` enum lacks required workflow stages: `'pending_information'`, `'resolution_submitted'`, and `'escalated'`.
- **Required Remediation:** Non-destructively alter `complaint_status` enum using `ALTER TYPE complaint_status ADD VALUE IF NOT EXISTS`.

### 2.5 `complaint_assignments`
- **Primary Key:** `id UUID DEFAULT uuid_generate_v4()`
- **Foreign Keys:** `complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE`, `officer_id UUID REFERENCES profiles(id)`, `assigned_by UUID REFERENCES profiles(id)`.
- **Key Columns:** `assignment_status`, `assigned_at`, `accepted_at`, `completed_at`, `notes`.
- **Audit Assessment:** **Compliant.** Correctly tracks officer assignment lifecycle.

### 2.6 `complaint_history` (Audit Trail & Stepper Timeline)
- **Primary Key:** `id UUID DEFAULT uuid_generate_v4()`
- **Foreign Keys:** `complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE`, `performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL`.
- **Key Columns:** `from_status`, `to_status`, `action`, `remarks`, `is_internal`, `created_at`.
- **Gaps Identified:**
  - Currently relies on manual application-level insertions; missing automatic database trigger to guarantee immutable logging on any status transition.
- **Required Remediation:** Add `trg_complaint_status_history` PostgreSQL trigger.

### 2.7 `complaint_attachments`
- **Primary Key:** `id UUID DEFAULT uuid_generate_v4()`
- **Foreign Keys:** `complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE`, `uploaded_by UUID REFERENCES profiles(id)`.
- **Key Columns:** `file_name`, `file_url`, `file_type`, `file_size_bytes`, `is_resolution_proof`, `created_at`.
- **Audit Assessment:** **Compliant.** Supports grievance photos, PDFs, and officer resolution proof.

### 2.8 `ai_predictions`
- **Primary Key:** `id UUID DEFAULT uuid_generate_v4()`
- **Foreign Keys:** `complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE`, `predicted_category_id UUID`, `predicted_department_id UUID`, `reviewed_by UUID REFERENCES profiles(id)`.
- **Key Columns:** `model_name`, `model_version`, `predicted_priority`, `confidence_score`, `suggested_summary`, `detected_language`, `sentiment`, `is_reviewed_by_human`.
- **Audit Assessment:** **Compliant.** Accommodates Python AI microservice inferences.

### 2.9 `duplicate_matches`
- **Primary Key:** `id UUID DEFAULT uuid_generate_v4()`
- **Foreign Keys:** `primary_complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE`, `potential_duplicate_id UUID REFERENCES complaints(id) ON DELETE CASCADE`.
- **Key Columns:** `similarity_score`, `distance_meters`, `time_difference_hours`, `status`, `verified_by`.
- **Constraint:** `UNIQUE(primary_complaint_id, potential_duplicate_id)`
- **Audit Assessment:** **Compliant.**

### 2.10 `escalations`
- **Primary Key:** `id UUID DEFAULT uuid_generate_v4()`
- **Foreign Keys:** `complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE`, `handled_by UUID REFERENCES profiles(id)`.
- **Key Columns:** `escalation_level`, `reason`, `status`, `triggered_at`, `resolved_at`, `action_taken`.
- **Audit Assessment:** **Compliant.**

### 2.11 `notifications`
- **Primary Key:** `id UUID DEFAULT uuid_generate_v4()`
- **Foreign Keys:** `user_id UUID REFERENCES profiles(id) ON DELETE CASCADE`, `complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE`.
- **Key Columns:** `title`, `message`, `type`, `is_read`, `read_at`.
- **Audit Assessment:** **Compliant.**

### 2.12 `feedback`
- **Primary Key:** `id UUID DEFAULT uuid_generate_v4()`
- **Foreign Keys:** `complaint_id UUID UNIQUE REFERENCES complaints(id) ON DELETE CASCADE`, `citizen_id UUID REFERENCES profiles(id)`.
- **Key Columns:** `rating (1-5)`, `comments`, `satisfaction_level`, `is_public`.
- **Audit Assessment:** **Compliant.**

### 2.13 `audit_logs`
- **Primary Key:** `id UUID DEFAULT uuid_generate_v4()`
- **Foreign Keys:** `actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL`.
- **Key Columns:** `action`, `entity_type`, `entity_id`, `old_data JSONB`, `new_data JSONB`, `ip_address`, `user_agent`.
- **Audit Assessment:** **Compliant.**

---

## 3. Missing Entities & Schema Gaps

| Entity / Capability | Current Status | Required Action |
| :--- | :--- | :--- |
| **`user_roles` Table** | Absent as relational entity (only enum/array in `profiles`) | Create `public.user_roles` table with multi-role support (`user_id`, `role`, `department_id`, `assigned_at`, `assigned_by`). |
| **Missing Complaint Workflow Enums** | `complaint_status` lacks `pending_information`, `resolution_submitted`, `escalated` | Alter `complaint_status` enum non-destructively to include all 11 lifecycle states. |
| **Storage Buckets** | Not configured in SQL | Create `storage.buckets` entries for `profile-photos` and `complaint-attachments` with file size and MIME constraints. |
| **Storage RLS Policies** | Missing | Add secure storage policies allowing users to upload only their own avatars and complaints owners/officers to upload attachments. |
| **Automated History Logging** | Manual application calls | Add PostgreSQL trigger `trg_complaint_status_history` on `complaints` updates. |
| **Auto Profile Creation on Auth** | Partially configured in triggers | Add robust `handle_new_user()` trigger on `auth.users` with default `citizen` role. |
| **Role-Checking Helper Functions** | Helper `current_user_role()` queried `profiles` directly | Build recursive-safe `public.has_role(user_uuid, user_role)` and `public.is_admin()` security definer functions. |
| **Hardcoded Administrative User** | Email hardcoded in `auth_enhancements.sql` | Remove hardcoded email trigger; replace with secure role assignment via invitations or administrative grant. |

---

## 4. Security & Row Level Security (RLS) Analysis

1. **Table Coverage:** All 13 existing tables have `ROW LEVEL SECURITY` enabled. However, policies were only defined for `profiles`, `departments`, `categories`, `complaints`, `notifications`, and `feedback`. The remaining tables (`complaint_assignments`, `complaint_history`, `complaint_attachments`, `ai_predictions`, `duplicate_matches`, `escalations`, `audit_logs`) were blocked by default for non-superusers.
2. **Policy Recursion Risk:** Helper functions querying `public.profiles` while `profiles` RLS is active can lead to recursion. The remediation is to use `SECURITY DEFINER` functions with fixed `search_path = public` that query `public.user_roles` and `public.profiles` without triggering recursive policy evaluations.
3. **Multi-Role Scoping:** Officers and Department Admins must have department-bounded access (`department_id = public.current_user_dept()`), Citizens must strictly access their own records (`citizen_id = auth.uid()`), and Super Admins must retain system-wide administrative privileges.

---

## 5. Storage Buckets & Policies Specification

1. **`profile-photos` Bucket:**
   - **Privacy:** Publicly readable (or authenticated read for avatars).
   - **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
   - **Max file size:** 5 MB.
   - **Upload/Update Policy:** User can insert/update only into their own path: `auth.uid() = (storage.foldername(name))[1]`.
2. **`complaint-attachments` Bucket:**
   - **Privacy:** Private / Authenticated.
   - **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `image/heic`.
   - **Max file size:** 15 MB.
   - **Access Policy:** Grievance owner, assigned officer, department admin, and super admin.

---

## 6. Recommended Migration Sequence

To prevent downtime and ensure zero data loss:
1. **Migration 002 (`supabase/migrations/002_multi_role_and_workflow_expansion.sql`):**
   - Non-destructively expand `complaint_status` enum.
   - Create `public.user_roles` table with unique constraints and foreign keys.
   - Backfill existing `profiles.role` into `public.user_roles`.
   - Remove hardcoded email triggers.
2. **Migration 003 (`supabase/migrations/003_storage_buckets_and_rls.sql`):**
   - Create storage buckets `profile-photos` and `complaint-attachments`.
   - Implement storage RLS policies.
3. **Migration 004 (`supabase/migrations/004_complete_rls_policies.sql`):**
   - Create recursion-safe helper functions (`public.has_role()`, `public.user_has_department()`).
   - Define non-recursive, exhaustive RLS policies across all 14 entities for Citizen, Officer, Department Admin, and Super Admin.
4. **Migration 005 (`supabase/migrations/005_automation_triggers_and_indexes.sql`):**
   - Auto-create profile & citizen role on `auth.users` signup.
   - Automatic grievance history audit trigger.
   - High-performance B-tree and composite indexes.
5. **Rollback Scripts:**
   - Companion rollback scripts stored in `supabase/migrations/rollbacks/` for safe reversal if ever needed.
