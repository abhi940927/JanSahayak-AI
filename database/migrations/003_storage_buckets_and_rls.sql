-- ==============================================================================
-- JANSAHAYAK AI - MIGRATION 003: STORAGE BUCKETS & STORAGE RLS POLICIES
-- ==============================================================================

-- 1. Create Storage Buckets if not already present
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'profile-photos', 
        'profile-photos', 
        true, 
        5242880, -- 5 MB
        ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    ),
    (
        'complaint-attachments', 
        'complaint-attachments', 
        false, 
        15728640, -- 15 MB
        ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf', 'image/heic']
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage RLS Policies for profile-photos Bucket
-- Anyone can view profile photos
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Profile Photos Access" ON storage.objects;
    CREATE POLICY "Public Profile Photos Access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-photos');
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

-- Authenticated users can upload their own profile photo
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
    CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'profile-photos' AND 
        (auth.uid())::text = (storage.foldername(name))[1]
    );
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

-- Users can update their own avatar
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
    CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'profile-photos' AND 
        (auth.uid())::text = (storage.foldername(name))[1]
    );
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

-- Users can delete their own avatar
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
    CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'profile-photos' AND 
        (auth.uid())::text = (storage.foldername(name))[1]
    );
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

-- 3. Storage RLS Policies for complaint-attachments Bucket
-- Authenticated users can read grievance attachments
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users view complaint attachments" ON storage.objects;
    CREATE POLICY "Authenticated users view complaint attachments"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'complaint-attachments');
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

-- Authenticated users can upload complaint attachments
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users upload complaint attachments" ON storage.objects;
    CREATE POLICY "Authenticated users upload complaint attachments"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'complaint-attachments');
EXCEPTION
    WHEN undefined_table THEN null;
END $$;
