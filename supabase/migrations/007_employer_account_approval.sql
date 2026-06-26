-- ============================================================
-- Migration 007: Employer Account Approval System
-- Employer baru otomatis masuk antrian verifikasi admin.
-- Lowongan hanya bisa dibuat jika is_verified = true.
-- ============================================================

-- 1. Buat dokumen_url nullable supaya bisa insert tanpa dokumen
--    (untuk "pendaftaran akun baru" — dokumen belum ada)
ALTER TABLE verification_requests
  ALTER COLUMN dokumen_url DROP NOT NULL;

-- 2. Tambah kolom tipe_request untuk bedakan registrasi vs badge
ALTER TABLE verification_requests
  ADD COLUMN IF NOT EXISTS tipe_request TEXT
    CHECK (tipe_request IN ('registrasi', 'badge'))
    DEFAULT 'badge';

-- Backfill data lama sebagai 'badge'
UPDATE verification_requests
  SET tipe_request = 'badge'
  WHERE tipe_request IS NULL;

-- 3. Pastikan employer_profiles punya kolom account_approved
--    (terpisah dari is_verified/badge agar semantik jelas)
ALTER TABLE employer_profiles
  ADD COLUMN IF NOT EXISTS account_approved BOOLEAN DEFAULT FALSE;

-- Employer yang sudah is_verified dianggap sudah approved juga
UPDATE employer_profiles
  SET account_approved = TRUE
  WHERE is_verified = TRUE;

-- 4. RLS: Admin bisa insert ke verification_requests
--    (untuk kasus server-side admin insert — tidak wajib, tapi aman)
DROP POLICY IF EXISTS "Admin can insert verification requests" ON verification_requests;
CREATE POLICY "Admin can insert verification requests"
  ON verification_requests FOR INSERT
  WITH CHECK (public.is_admin());
