-- ============================================================
-- Migration 006: Fix employer bugs
-- 1. Lowongan employer tidak muncul di Kelola Lowongan
-- 2. Dashboard cards tidak update (applicant count query gagal)
-- ============================================================

-- ============================================================
-- FIX 1: Employer can view own jobs (any status)
-- Policy ini kadang bentrok dengan policy lain. Recreate clean.
-- ============================================================
DROP POLICY IF EXISTS "Employer can view own jobs" ON jobs;
CREATE POLICY "Employer can view own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = employer_id);

-- ============================================================
-- FIX 2: Employer dapat query applications via job_id
-- Policy lama pakai subquery EXISTS ke jobs — ini bisa gagal
-- karena Postgres perlu re-evaluate RLS jobs lagi (nested RLS).
-- Ganti pakai fungsi SECURITY DEFINER supaya bypass RLS di subquery.
-- ============================================================

-- Helper function: cek apakah job_id dimiliki employer yang sedang login
CREATE OR REPLACE FUNCTION public.is_own_job(p_job_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.jobs
    WHERE id = p_job_id AND employer_id = auth.uid()
  );
END;
$$;

-- Recreate policies untuk applications menggunakan fungsi di atas
DROP POLICY IF EXISTS "Employer can view applications for own jobs" ON applications;
CREATE POLICY "Employer can view applications for own jobs"
  ON applications FOR SELECT
  USING (public.is_own_job(job_id));

DROP POLICY IF EXISTS "Employer can update application status" ON applications;
CREATE POLICY "Employer can update application status"
  ON applications FOR UPDATE
  USING (public.is_own_job(job_id));

-- ============================================================
-- FIX 3: Pastikan employer bisa query applications.job_id list
-- (untuk count di dashboard — .in("job_id", jobIds))
-- Policy di atas sudah cukup, tapi tambahkan grant eksplisit
-- supaya SELECT count(*) juga bisa jalan
-- ============================================================

-- Tidak perlu GRANT tambahan karena Supabase anon/authenticated
-- sudah punya SELECT privilege. Cukup RLS policy di atas.

-- ============================================================
-- FIX 4: employer_profiles — tambah kolom logo_url jika belum ada
-- (untuk fix Bug 2: upload foto profil perusahaan)
-- ============================================================
ALTER TABLE employer_profiles
  ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);

-- ============================================================
-- FIX 5: Storage bucket policy untuk company-logos
-- Jalankan di Supabase Dashboard > Storage > Policies
-- atau lewat SQL berikut:
-- ============================================================

-- Buat bucket company-logos jika belum ada
-- (ini hanya bisa lewat Dashboard atau Supabase CLI, bukan SQL murni)
-- Instruksi manual ada di bawah.

-- Storage RLS untuk bucket company-logos
-- Employer bisa upload logo mereka sendiri
DO $$
BEGIN
  -- Insert bucket jika belum ada (via storage.buckets)
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('company-logos', 'company-logos', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Policy: employer bisa upload ke folder mereka sendiri
DROP POLICY IF EXISTS "Employer can upload own logo" ON storage.objects;
CREATE POLICY "Employer can upload own logo"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Employer can update own logo" ON storage.objects;
CREATE POLICY "Employer can update own logo"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'company-logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Public can view company logos" ON storage.objects;
CREATE POLICY "Public can view company logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');
