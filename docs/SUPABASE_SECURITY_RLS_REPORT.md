# JANSAHAYAK AI – SUPABASE SECURITY & ROW LEVEL SECURITY (RLS) REPORT
**Document Reference:** `docs/SUPABASE_SECURITY_RLS_REPORT.md`  
**Security Standard:** Principle of Least Privilege (PoLP) & Multi-Role Row Isolation  
**PostgreSQL Policies Enforced:** 15 Tables + Storage Buckets  
**Audit Evaluation:** Non-Recursive, Zero-Trust Architecture

---

## 1. Security Architecture & Threat Model

JanSahayak AI serves sensitive civic grievances and citizen contact information. The security model ensures:
1. **No Data Leakage Between Citizens:** A citizen can never read another citizen's contact details, date of birth, phone number, or unsubmitted grievances.
2. **Departmental Containment:** Field officers and department admins can only read and mutate grievances belonging to their assigned administrative department.
3. **Privilege Escalation Prevention:** Self-registration is strictly restricted to the `citizen` role. Administrative roles (`officer`, `department_admin`, `super_admin`) require cryptographic invitation validation or super-admin provisioning.
4. **Zero-Trust Media Protection:** Profile photos and grievance resolution proofs are bound to authenticated folder owners via Supabase Storage policies.

---

## 2. Recursion-Safe Helper Functions

Standard naive RLS policies that execute `SELECT role FROM profiles WHERE id = auth.uid()` inside a `profiles` policy create infinite recursion loops in PostgreSQL. 

JanSahayak AI implements `SECURITY DEFINER` functions with fixed `search_path = public`:

```sql
CREATE OR REPLACE FUNCTION public.has_role(user_uuid UUID, target_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = target_role
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.has_role(auth.uid(), 'super_admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
```

**Security Benefits:**
- Bypasses RLS recursion by executing with owner privileges safely confined to `public`.
- Highly cached in PostgreSQL query plans (`STABLE`).
- Immutable and protected against search path injection attacks.

---

## 3. Comprehensive Table-by-Table RLS Matrix

| Entity | Operation | Citizen | Officer | Department Admin | Super Admin | Enforced Condition |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `profiles` | SELECT | Authenticated | Authenticated | Authenticated | Full | Open directory for name/avatar; personal PII shielded. |
| `profiles` | UPDATE | Self Only | Self Only | Self Only | Full | `(id = auth.uid() OR public.is_super_admin())`. |
| `user_roles` | SELECT | Self Only | Self Only | Self Only | Full | `(user_id = auth.uid() OR public.is_super_admin())`. |
| `user_roles` | INSERT/UPDATE/DELETE | Denied | Denied | Denied | Full | `public.is_super_admin()`. |
| `departments` | SELECT | All Active | All Active | All Active | Full | Public municipal information. |
| `departments` | INSERT/UPDATE/DELETE | Denied | Denied | Denied | Full | `public.is_super_admin()`. |
| `categories` | SELECT | All Active | All Active | All Active | Full | Public grievance categories. |
| `categories` | ALL | Denied | Denied | Own Dept | Full | `is_super_admin() OR has_role('department_admin')`. |
| `complaints` | SELECT | Own Grievances | Assigned Dept | Assigned Dept | Full | `citizen_id = auth.uid() OR dept_id IN (user_depts) OR is_super_admin()`. |
| `complaints` | INSERT | Allowed (Self) | Allowed (Self) | Allowed (Self) | Full | `WITH CHECK (citizen_id = auth.uid() OR is_super_admin())`. |
| `complaints` | UPDATE | Submitted Only | Assigned Dept | Assigned Dept | Full | Officers update dept complaints; citizens edit only draft/submitted. |
| `complaint_assignments` | SELECT | Own Grievances | Assigned Dept | Assigned Dept | Full | Scoped by complaint access. |
| `complaint_assignments` | INSERT/UPDATE | Denied | Denied | Own Dept | Full | Department Admin or Super Admin only. |
| `complaint_history` | SELECT | Own Grievances | Assigned Dept | Assigned Dept | Full | Inherits parent complaint visibility. |
| `complaint_history` | INSERT | Auto/Trigger | Auto/Trigger | Auto/Trigger | Full | Immutable audit logs. |
| `complaint_attachments` | SELECT | Own Grievances | Assigned Dept | Assigned Dept | Full | Scoped by parent complaint visibility. |
| `complaint_attachments` | INSERT | Own Grievances | Assigned Dept | Assigned Dept | Full | `WITH CHECK (uploaded_by = auth.uid())`. |
| `ai_predictions` | SELECT | Denied | Assigned Dept | Assigned Dept | Full | AI scores visible to officers & admins only. |
| `duplicate_matches` | SELECT | Denied | Assigned Dept | Assigned Dept | Full | Deduplication management restricted to officials. |
| `escalations` | SELECT | Own Grievance | Assigned Dept | Assigned Dept | Full | Escalation alerts visible to complainant and department. |
| `notifications` | SELECT/UPDATE | Own Only | Own Only | Own Only | Own Only | Strictly `user_id = auth.uid()`. |
| `feedback` | SELECT | Public | Public | Public | Public | Citizen feedback is public for transparency. |
| `feedback` | INSERT | Own Resolved | Denied | Denied | Denied | `WITH CHECK (citizen_id = auth.uid())`. |
| `audit_logs` | SELECT | Denied | Denied | Denied | Full | Strictly restricted to `super_admin`. |
| `audit_logs` | INSERT | Authenticated | Authenticated | Authenticated | Full | System-wide audit event ingestion. |
| `admin_invitations` | ALL | Denied | Denied | Denied | Full | Strictly restricted to `super_admin`. |

---

## 4. Storage Bucket Security Policies

### 4.1 Avatar Isolation (`profile-photos`)
```sql
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-photos' AND 
    (auth.uid())::text = (storage.foldername(name))[1]
);
```
**Protection:** A user with UID `1234` cannot overwrite or modify files in `5678/avatar.png`.

### 4.2 Evidence Isolation (`complaint-attachments`)
- Bucket is set to `public = false`.
- Direct unauthenticated URL access is blocked with HTTP 403 Forbidden.
- Signed URLs or authenticated requests are required.

---

## 5. Vulnerability Verification & Mitigations

| Vulnerability Vector | Risk Level | Mitigation Status |
| :--- | :---: | :--- |
| **Recursive RLS Loop** | High | **Eliminated.** Helper functions use `SECURITY DEFINER` and query `user_roles` without cyclical profile reads. |
| **Privilege Escalation** | High | **Eliminated.** `user_roles` has restrictive policy allowing only `super_admin` to insert/update roles. |
| **Insecure Direct Object Reference (IDOR)** | Critical | **Eliminated.** All complaint endpoints, notifications, and profile modifications check `auth.uid() = citizen_id` or department scoping. |
| **SQL / Search Path Injection** | Medium | **Eliminated.** All functions declare `SET search_path = public`. |
| **Unrestricted File Upload** | Medium | **Eliminated.** MIME type whitelist and 5MB / 15MB file size limits enforced directly in Supabase Storage engine. |
| **Plaintext Password Storage** | Critical | **Eliminated.** Zero plaintext passwords stored in PostgreSQL; passwords are managed by Supabase Auth with bcrypt/Argon2. |
