-- ============================================================
-- Migration 005: Fix infinite recursion pada RLS policy admin
-- ============================================================
-- Masalah: policy "Admin can view/update ..." mengecek role admin
-- dengan query "SELECT 1 FROM profiles WHERE id = auth.uid() AND
-- role = 'admin'" LANGSUNG di dalam policy tabel profiles itu sendiri.
-- Ini bikin Postgres harus evaluasi RLS profiles lagi untuk subquery
-- itu -> infinite recursion -> error "infinite recursion detected
-- in policy for relation 'profiles'".
--
-- Solusi: pakai fungsi SECURITY DEFINER. Fungsi ini jalan dengan
-- privilege pemilik fungsi (bypass RLS), jadi subquery di dalamnya
-- TIDAK memicu RLS profiles lagi -> rantai recursion putus.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- ============================================================
-- Ganti semua policy admin agar pakai is_admin() (bukan subquery langsung)
-- ============================================================

-- Profiles (ini yang langsung bikin error kamu)
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can update any profile" ON profiles;
CREATE POLICY "Admin can update any profile"
  ON profiles FOR UPDATE
  USING (public.is_admin());

-- Jobs
DROP POLICY IF EXISTS "Admin can view all jobs" ON jobs;
CREATE POLICY "Admin can view all jobs"
  ON jobs FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can update any job" ON jobs;
CREATE POLICY "Admin can update any job"
  ON jobs FOR UPDATE
  USING (public.is_admin());

-- Applications
DROP POLICY IF EXISTS "Admin can view all applications" ON applications;
CREATE POLICY "Admin can view all applications"
  ON applications FOR SELECT
  USING (public.is_admin());

-- Reviews
DROP POLICY IF EXISTS "Admin can delete reviews" ON reviews;
CREATE POLICY "Admin can delete reviews"
  ON reviews FOR DELETE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can update reviews" ON reviews;
CREATE POLICY "Admin can update reviews"
  ON reviews FOR UPDATE
  USING (public.is_admin());

-- Verification requests
DROP POLICY IF EXISTS "Admin can view all verification requests" ON verification_requests;
CREATE POLICY "Admin can view all verification requests"
  ON verification_requests FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can update verification requests" ON verification_requests;
CREATE POLICY "Admin can update verification requests"
  ON verification_requests FOR UPDATE
  USING (public.is_admin());

-- Storage: verification docs (skip kalau policy ini belum pernah dibuat,
-- aman pakai DROP IF EXISTS)
DROP POLICY IF EXISTS "Admin can view all verification docs" ON storage.objects;
CREATE POLICY "Admin can view all verification docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-docs'
    AND public.is_admin()
  );