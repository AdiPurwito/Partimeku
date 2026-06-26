-- ============================================
-- Migration 010: Storage bucket untuk bukti transfer pembayaran
-- ============================================
-- Sebelumnya kolom payments.bukti_url sudah ada (migration 008) tapi
-- belum pernah diisi karena UpgradeForm.tsx cuma minta catatan teks,
-- bukan upload file. Migration ini bikin bucket privat khusus
-- screenshot/bukti transfer, dengan pola RLS yang sama seperti
-- bucket 'verification-docs' (employer hanya bisa upload & lihat
-- punya sendiri, admin bisa lihat semua).

-- 1. Bucket privat untuk bukti transfer
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Employer upload bukti transfer miliknya sendiri
--    (path harus diawali folder = user id, mis. "<user_id>/169999.jpg")
DROP POLICY IF EXISTS "Employers can upload payment proof" ON storage.objects;
CREATE POLICY "Employers can upload payment proof"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Employer lihat bukti transfer miliknya sendiri
DROP POLICY IF EXISTS "Employers can view own payment proof" ON storage.objects;
CREATE POLICY "Employers can view own payment proof"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Admin lihat semua bukti transfer (untuk verifikasi pembayaran)
DROP POLICY IF EXISTS "Admin can view all payment proofs" ON storage.objects;
CREATE POLICY "Admin can view all payment proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND public.is_admin()
  );
