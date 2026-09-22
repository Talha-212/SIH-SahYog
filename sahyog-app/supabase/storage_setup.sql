-- ==========================================================
-- SahYog Platform (SIH PS ID: SIH26043)
-- Supabase Storage Buckets & Storage Security Policies (RLS)
-- ==========================================================
-- Run this script in the Supabase Dashboard -> SQL Editor
-- to provision the 5 official storage buckets and their security policies.

-- 1. Create the 5 Dedicated Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'problem-evidence',
    'problem-evidence',
    true,
    15728640, -- 15MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'video/mp4', 'image/gif']
  ),
  (
    'verification-evidence',
    'verification-evidence',
    true,
    15728640, -- 15MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'video/mp4', 'image/gif']
  ),
  (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  ),
  (
    'organization-logos',
    'organization-logos',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  ),
  (
    'demo-assets',
    'demo-assets',
    true,
    15728640, -- 15MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'video/mp4']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ==========================================================
-- 2. Storage Row Level Security (RLS) Policies
-- ==========================================================

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- A. problem-evidence Policies
-- ----------------------------------------------------------
-- Allow public/authenticated read of problem evidence
CREATE POLICY "Public Read Access for Problem Evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'problem-evidence');

-- Allow authenticated users to upload problem evidence
CREATE POLICY "Authenticated Users Can Upload Problem Evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'problem-evidence');

-- Allow anon users during prototype demonstration to upload problem evidence
CREATE POLICY "Anon Users Can Upload Problem Evidence in Prototype"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'problem-evidence');

-- ----------------------------------------------------------
-- B. verification-evidence Policies
-- ----------------------------------------------------------
-- Allow public/authenticated read of verification evidence
CREATE POLICY "Public Read Access for Verification Evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'verification-evidence');

-- Allow authenticated users to upload resolution verification photos
CREATE POLICY "Authenticated Users Can Upload Verification Evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification-evidence');

-- Allow anon users in demo mode to upload verification evidence
CREATE POLICY "Anon Users Can Upload Verification Evidence in Prototype"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'verification-evidence');

-- ----------------------------------------------------------
-- C. avatars Policies
-- ----------------------------------------------------------
CREATE POLICY "Public Read Access for User Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated Users Can Upload Their Own Avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users Can Update Their Own Avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ----------------------------------------------------------
-- D. organization-logos Policies
-- ----------------------------------------------------------
CREATE POLICY "Public Read Access for Organization Logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'organization-logos');

CREATE POLICY "Authenticated Users Can Upload Organization Logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organization-logos');

-- ----------------------------------------------------------
-- E. demo-assets Policies
-- ----------------------------------------------------------
CREATE POLICY "Public Read Access for Demo Assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'demo-assets');
