-- ==============================================================================
-- JANSAHAYAK AI - MIGRATION 004: COMPLETE NON-RECURSIVE RLS POLICIES
-- ==============================================================================

-- 1. Recursion-Safe Security Definer Helper Functions
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

CREATE OR REPLACE FUNCTION public.is_department_admin(dept_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    IF dept_id IS NULL THEN
        RETURN public.has_role(auth.uid(), 'department_admin') OR public.is_super_admin();
    ELSE
        RETURN EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
              AND role = 'department_admin' 
              AND (department_id = dept_id OR department_id IS NULL)
        ) OR public.is_super_admin();
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_officer(dept_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    IF dept_id IS NULL THEN
        RETURN public.has_role(auth.uid(), 'officer') 
            OR public.has_role(auth.uid(), 'department_admin') 
            OR public.is_super_admin();
    ELSE
        RETURN EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
              AND role IN ('officer', 'department_admin')
              AND (department_id = dept_id OR department_id IS NULL)
        ) OR public.is_super_admin();
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_departments(user_uuid UUID)
RETURNS TABLE (dept_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT department_id FROM public.user_roles 
    WHERE user_id = user_uuid AND department_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Ensure RLS is Enabled on ALL Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duplicate_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- 3. PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
CREATE POLICY "Profiles select policy"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.is_super_admin())
    WITH CHECK (id = auth.uid() OR public.is_super_admin());

-- 4. USER_ROLES POLICIES
DROP POLICY IF EXISTS "User roles view policy" ON public.user_roles;
CREATE POLICY "User roles view policy"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admin manage user roles" ON public.user_roles;
CREATE POLICY "Super admin manage user roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- 5. DEPARTMENTS & CATEGORIES POLICIES
DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;
CREATE POLICY "Anyone can view departments"
    ON public.departments FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Super admins manage departments" ON public.departments;
CREATE POLICY "Super admins manage departments"
    ON public.departments FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories"
    ON public.categories FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (public.is_super_admin() OR public.has_role(auth.uid(), 'department_admin'))
    WITH CHECK (public.is_super_admin() OR public.has_role(auth.uid(), 'department_admin'));

-- 6. COMPLAINTS POLICIES
DROP POLICY IF EXISTS "Complaints select policy" ON public.complaints;
CREATE POLICY "Complaints select policy"
    ON public.complaints FOR SELECT
    TO authenticated
    USING (
        citizen_id = auth.uid()
        OR public.is_super_admin()
        OR department_id IN (SELECT dept_id FROM public.get_user_departments(auth.uid()))
        OR EXISTS (
            SELECT 1 FROM public.complaint_assignments 
            WHERE complaint_id = public.complaints.id AND officer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Complaints insert policy" ON public.complaints;
CREATE POLICY "Complaints insert policy"
    ON public.complaints FOR INSERT
    TO authenticated
    WITH CHECK (citizen_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Complaints update policy" ON public.complaints;
CREATE POLICY "Complaints update policy"
    ON public.complaints FOR UPDATE
    TO authenticated
    USING (
        public.is_super_admin()
        OR department_id IN (SELECT dept_id FROM public.get_user_departments(auth.uid()))
        OR EXISTS (
            SELECT 1 FROM public.complaint_assignments 
            WHERE complaint_id = public.complaints.id AND officer_id = auth.uid()
        )
        OR (citizen_id = auth.uid() AND status IN ('submitted', 'reopened'))
    );

-- 7. COMPLAINT_ASSIGNMENTS POLICIES
DROP POLICY IF EXISTS "Assignments select policy" ON public.complaint_assignments;
CREATE POLICY "Assignments select policy"
    ON public.complaint_assignments FOR SELECT
    TO authenticated
    USING (
        officer_id = auth.uid()
        OR assigned_by = auth.uid()
        OR public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.complaints c 
            WHERE c.id = complaint_id 
              AND (c.citizen_id = auth.uid() OR c.department_id IN (SELECT dept_id FROM public.get_user_departments(auth.uid())))
        )
    );

DROP POLICY IF EXISTS "Assignments manage policy" ON public.complaint_assignments;
CREATE POLICY "Assignments manage policy"
    ON public.complaint_assignments FOR ALL
    TO authenticated
    USING (public.is_super_admin() OR public.has_role(auth.uid(), 'department_admin'))
    WITH CHECK (public.is_super_admin() OR public.has_role(auth.uid(), 'department_admin'));

-- 8. COMPLAINT_HISTORY POLICIES
DROP POLICY IF EXISTS "History select policy" ON public.complaint_history;
CREATE POLICY "History select policy"
    ON public.complaint_history FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.complaints c 
            WHERE c.id = complaint_id 
              AND (
                  c.citizen_id = auth.uid() 
                  OR public.is_super_admin()
                  OR c.department_id IN (SELECT dept_id FROM public.get_user_departments(auth.uid()))
              )
        )
    );

DROP POLICY IF EXISTS "History insert policy" ON public.complaint_history;
CREATE POLICY "History insert policy"
    ON public.complaint_history FOR INSERT
    TO authenticated
    WITH CHECK (performed_by = auth.uid() OR performed_by IS NULL);

-- 9. COMPLAINT_ATTACHMENTS POLICIES
DROP POLICY IF EXISTS "Attachments select policy" ON public.complaint_attachments;
CREATE POLICY "Attachments select policy"
    ON public.complaint_attachments FOR SELECT
    TO authenticated
    USING (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.complaints c 
            WHERE c.id = complaint_id 
              AND (
                  c.citizen_id = auth.uid() 
                  OR public.is_super_admin()
                  OR c.department_id IN (SELECT dept_id FROM public.get_user_departments(auth.uid()))
              )
        )
    );

DROP POLICY IF EXISTS "Attachments insert policy" ON public.complaint_attachments;
CREATE POLICY "Attachments insert policy"
    ON public.complaint_attachments FOR INSERT
    TO authenticated
    WITH CHECK (uploaded_by = auth.uid());

-- 10. AI_PREDICTIONS & DUPLICATE_MATCHES POLICIES
DROP POLICY IF EXISTS "AI predictions view policy" ON public.ai_predictions;
CREATE POLICY "AI predictions view policy"
    ON public.ai_predictions FOR SELECT
    TO authenticated
    USING (public.is_super_admin() OR public.is_officer());

DROP POLICY IF EXISTS "Duplicate matches view policy" ON public.duplicate_matches;
CREATE POLICY "Duplicate matches view policy"
    ON public.duplicate_matches FOR SELECT
    TO authenticated
    USING (public.is_super_admin() OR public.is_officer());

-- 11. ESCALATIONS POLICIES
DROP POLICY IF EXISTS "Escalations select policy" ON public.escalations;
CREATE POLICY "Escalations select policy"
    ON public.escalations FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin() 
        OR public.is_officer()
        OR EXISTS (
            SELECT 1 FROM public.complaints c 
            WHERE c.id = complaint_id AND c.citizen_id = auth.uid()
        )
    );

-- 12. NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Notifications select policy" ON public.notifications;
CREATE POLICY "Notifications select policy"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Notifications update policy" ON public.notifications;
CREATE POLICY "Notifications update policy"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 13. FEEDBACK POLICIES
DROP POLICY IF EXISTS "Feedback select policy" ON public.feedback;
CREATE POLICY "Feedback select policy"
    ON public.feedback FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Feedback insert policy" ON public.feedback;
CREATE POLICY "Feedback insert policy"
    ON public.feedback FOR INSERT
    TO authenticated
    WITH CHECK (citizen_id = auth.uid());

-- 14. AUDIT_LOGS POLICIES
DROP POLICY IF EXISTS "Audit logs select policy" ON public.audit_logs;
CREATE POLICY "Audit logs select policy"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Audit logs insert policy" ON public.audit_logs;
CREATE POLICY "Audit logs insert policy"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 15. ADMIN_INVITATIONS POLICIES
DROP POLICY IF EXISTS "Super admins manage invitations" ON public.admin_invitations;
CREATE POLICY "Super admins manage invitations"
    ON public.admin_invitations FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());
