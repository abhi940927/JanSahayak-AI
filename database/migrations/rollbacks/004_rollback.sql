-- ==============================================================================
-- ROLLBACK SCRIPT FOR MIGRATION 004
-- ==============================================================================

DROP POLICY IF EXISTS "Super admins manage invitations" ON public.admin_invitations;
DROP POLICY IF EXISTS "Audit logs insert policy" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs select policy" ON public.audit_logs;
DROP POLICY IF EXISTS "Feedback insert policy" ON public.feedback;
DROP POLICY IF EXISTS "Feedback select policy" ON public.feedback;
DROP POLICY IF EXISTS "Notifications update policy" ON public.notifications;
DROP POLICY IF EXISTS "Notifications select policy" ON public.notifications;
DROP POLICY IF EXISTS "Escalations select policy" ON public.escalations;
DROP POLICY IF EXISTS "Duplicate matches view policy" ON public.duplicate_matches;
DROP POLICY IF EXISTS "AI predictions view policy" ON public.ai_predictions;
DROP POLICY IF EXISTS "Attachments insert policy" ON public.complaint_attachments;
DROP POLICY IF EXISTS "Attachments select policy" ON public.complaint_attachments;
DROP POLICY IF EXISTS "History insert policy" ON public.complaint_history;
DROP POLICY IF EXISTS "History select policy" ON public.complaint_history;
DROP POLICY IF EXISTS "Assignments manage policy" ON public.complaint_assignments;
DROP POLICY IF EXISTS "Assignments select policy" ON public.complaint_assignments;
DROP POLICY IF EXISTS "Complaints update policy" ON public.complaints;
DROP POLICY IF EXISTS "Complaints insert policy" ON public.complaints;
DROP POLICY IF EXISTS "Complaints select policy" ON public.complaints;
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Super admins manage departments" ON public.departments;
DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;
DROP POLICY IF EXISTS "Super admin manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "User roles view policy" ON public.user_roles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;

DROP FUNCTION IF EXISTS public.get_user_departments(UUID);
DROP FUNCTION IF EXISTS public.is_officer(UUID);
DROP FUNCTION IF EXISTS public.is_department_admin(UUID);
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.has_role(UUID, user_role);
