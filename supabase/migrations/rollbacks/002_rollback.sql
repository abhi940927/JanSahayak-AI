-- ==============================================================================
-- ROLLBACK SCRIPT FOR MIGRATION 002
-- ==============================================================================

DROP TABLE IF EXISTS public.admin_invitations CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
-- Note: Enum values in PostgreSQL cannot be dropped safely without dropping dependent tables/columns;
-- existing records will continue to function normally.
