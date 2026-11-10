-- ==============================================================================
-- JANSAHAYAK AI - MIGRATION 005: AUTOMATION TRIGGERS & PERFORMANCE INDEXES
-- ==============================================================================

-- 1. Automatic Profile & Citizen Role Creation on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_phone TEXT;
    v_dob DATE;
    v_avatar TEXT;
BEGIN
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    v_phone := NEW.raw_user_meta_data->>'phone_number';
    v_avatar := NEW.raw_user_meta_data->>'avatar_url';
    
    IF NEW.raw_user_meta_data->>'dob' IS NOT NULL THEN
        BEGIN
            v_dob := (NEW.raw_user_meta_data->>'dob')::DATE;
        EXCEPTION WHEN OTHERS THEN
            v_dob := NULL;
        END;
    END IF;

    -- Insert profile
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        phone_number, 
        dob, 
        avatar_url, 
        role, 
        roles
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_full_name,
        v_phone,
        v_dob,
        v_avatar,
        'citizen',
        ARRAY['citizen']::TEXT[]
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number),
        dob = COALESCE(EXCLUDED.dob, public.profiles.dob),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

    -- Insert default citizen role into user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'citizen')
    ON CONFLICT (user_id, role, department_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger to auth.users if available
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- 2. Automatic Complaint Status Transition History Trigger
CREATE OR REPLACE FUNCTION public.record_complaint_history()
RETURNS TRIGGER AS $$
DECLARE
    v_actor UUID;
BEGIN
    -- Determine actor
    v_actor := auth.uid();

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.complaint_history (
            complaint_id,
            performed_by,
            from_status,
            to_status,
            action,
            remarks
        )
        VALUES (
            NEW.id,
            COALESCE(v_actor, NEW.citizen_id),
            NULL,
            NEW.status,
            'Grievance Registered',
            'Complaint registered via JanSahayak Portal'
        );
    ELSIF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
        INSERT INTO public.complaint_history (
            complaint_id,
            performed_by,
            from_status,
            to_status,
            action,
            remarks
        )
        VALUES (
            NEW.id,
            v_actor,
            OLD.status,
            NEW.status,
            'Status Changed To ' || replace(initcap(replace(NEW.status::TEXT, '_', ' ')), ' ', ' '),
            'Automated workflow progression status update'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_complaint_history_record ON public.complaints;
CREATE TRIGGER trg_complaint_history_record
    AFTER INSERT OR UPDATE ON public.complaints
    FOR EACH ROW EXECUTE FUNCTION public.record_complaint_history();

-- 3. Automatic Synchronization of profiles.roles array with user_roles table
CREATE OR REPLACE FUNCTION public.sync_profile_roles()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    computed_roles TEXT[];
    computed_primary_role user_role;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_user_id := OLD.user_id;
    ELSE
        target_user_id := NEW.user_id;
    END IF;

    SELECT array_agg(DISTINCT role::TEXT)
    INTO computed_roles
    FROM public.user_roles
    WHERE user_id = target_user_id;

    -- Pick highest priority role: super_admin > department_admin > officer > citizen
    IF 'super_admin' = ANY(computed_roles) THEN
        computed_primary_role := 'super_admin';
    ELSIF 'department_admin' = ANY(computed_roles) THEN
        computed_primary_role := 'department_admin';
    ELSIF 'officer' = ANY(computed_roles) THEN
        computed_primary_role := 'officer';
    ELSE
        computed_primary_role := 'citizen';
    END IF;

    UPDATE public.profiles
    SET 
        roles = COALESCE(computed_roles, ARRAY['citizen']::TEXT[]),
        role = COALESCE(computed_primary_role, 'citizen')
    WHERE id = target_user_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_profile_roles ON public.user_roles;
CREATE TRIGGER trg_sync_profile_roles
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_roles();

-- 4. High-Performance Query Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_citizen_status ON public.complaints(citizen_id, status);
CREATE INDEX IF NOT EXISTS idx_complaints_dept_status ON public.complaints(department_id, status);
CREATE INDEX IF NOT EXISTS idx_complaints_sla_active ON public.complaints(sla_due_at) WHERE status NOT IN ('resolved', 'closed');
CREATE INDEX IF NOT EXISTS idx_complaint_history_timeline ON public.complaint_history(complaint_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_user_roles_composite ON public.user_roles(user_id, role);
