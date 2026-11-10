-- ==============================================================================
-- ROLLBACK SCRIPT FOR MIGRATION 003
-- ==============================================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Profile Photos Access" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users view complaint attachments" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users upload complaint attachments" ON storage.objects;
    DELETE FROM storage.buckets WHERE id IN ('profile-photos', 'complaint-attachments');
EXCEPTION
    WHEN undefined_table THEN null;
END $$;
