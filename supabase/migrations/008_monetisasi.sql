-- ============================================
-- Migration 008: Monetisasi Sederhana Partimeku
-- Konsep MVP: manual transfer, konfirmasi admin
-- ============================================

-- 1. Tambah kolom plan ke employer_profiles
--    free  → 2 lowongan aktif
--    pro   → unlimited (Rp 99.000/bulan)
ALTER TABLE employer_profiles
  ADD COLUMN IF NOT EXISTS plan            TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- 2. Tabel pembayaran (manual transfer)
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  jumlah          BIGINT NOT NULL,              -- Rupiah, misal 99000
  durasi_bulan    SMALLINT NOT NULL DEFAULT 1,
  bukti_url       TEXT,                         -- screenshot bukti transfer (opsional MVP awal)
  catatan         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'lunas', 'batal')),
  confirmed_by    UUID REFERENCES profiles(id), -- admin yang konfirmasi
  confirmed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS: employer hanya lihat milik sendiri, admin bisa semua
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employer lihat payment sendiri"
  ON payments FOR SELECT
  USING (employer_id = auth.uid());

CREATE POLICY "Employer insert payment sendiri"
  ON payments FOR INSERT
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Admin kelola semua payment"
  ON payments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Function konfirmasi bayar → aktifkan plan Pro
CREATE OR REPLACE FUNCTION confirm_payment(payment_id UUID, admin_user_id UUID)
RETURNS VOID AS $$
DECLARE
  p payments%ROWTYPE;
  current_expiry TIMESTAMPTZ;
  new_expiry TIMESTAMPTZ;
BEGIN
  SELECT * INTO p FROM payments WHERE id = payment_id;
  IF p IS NULL THEN RAISE EXCEPTION 'Payment tidak ditemukan'; END IF;
  IF p.status != 'pending' THEN RAISE EXCEPTION 'Payment sudah diproses'; END IF;

  -- Hitung expiry: perpanjang dari expiry sebelumnya kalau masih aktif
  SELECT plan_expires_at INTO current_expiry
  FROM employer_profiles WHERE user_id = p.employer_id;

  IF current_expiry IS NOT NULL AND current_expiry > NOW() THEN
    new_expiry := current_expiry + (p.durasi_bulan || ' months')::INTERVAL;
  ELSE
    new_expiry := NOW() + (p.durasi_bulan || ' months')::INTERVAL;
  END IF;

  -- Update payment
  UPDATE payments
  SET status = 'lunas', confirmed_by = admin_user_id, confirmed_at = NOW()
  WHERE id = payment_id;

  -- Aktifkan plan Pro
  UPDATE employer_profiles
  SET plan = 'pro', plan_expires_at = new_expiry, updated_at = NOW()
  WHERE user_id = p.employer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. View ringkasan pemasukan (dipakai di dashboard admin)
CREATE OR REPLACE VIEW revenue_summary AS
SELECT
  COUNT(*) FILTER (WHERE status = 'lunas')                          AS total_transaksi,
  COALESCE(SUM(jumlah) FILTER (WHERE status = 'lunas'), 0)          AS total_pemasukan,
  COALESCE(SUM(jumlah) FILTER (WHERE status = 'lunas'
    AND confirmed_at >= date_trunc('month', NOW())), 0)              AS pemasukan_bulan_ini,
  COALESCE(SUM(jumlah) FILTER (WHERE status = 'lunas'
    AND confirmed_at >= date_trunc('month', NOW()) - INTERVAL '1 month'
    AND confirmed_at <  date_trunc('month', NOW())), 0)              AS pemasukan_bulan_lalu,
  COUNT(*) FILTER (WHERE status = 'pending')                         AS menunggu_konfirmasi
FROM payments;
