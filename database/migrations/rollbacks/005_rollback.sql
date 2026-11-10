-- ==============================================================================
-- ROLLBACK SCRIPT FOR MIGRATION 005
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_sync_profile_roles ON public.user_roles;
DROP FUNCTION IF EXISTS public.sync_profile_roles();

DROP TRIGGER IF EXISTS trg_complaint_history_record ON public.complaints;
DROP FUNCTION IF EXISTS public.record_complaint_history();

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    END IF;
END $$;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP INDEX IF EXISTS public.idx_user_roles_composite;
DROP INDEX IF EXISTS public.idx_complaint_history_timeline;
DROP INDEX IF EXISTS public.idx_complaints_sla_active;
DROP INDEX IF EXISTS public.idx_complaints_dept_status;
DROP INDEX IF EXISTS public.idx_complaints_citizen_status;
