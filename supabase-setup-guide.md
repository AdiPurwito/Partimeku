# Panduan Setup Supabase untuk Partimeku

Ikuti langkah-langkah ini **secara berurutan** di Supabase Dashboard kamu.

---

## 🔗 Buka Project Supabase

Masuk ke: **https://supabase.com/dashboard** → pilih project Partimeku.

---

## LANGKAH 1 — Jalankan SQL Migration

Buka **SQL Editor** (ikon terminal di sidebar kiri), lalu jalankan SQL berikut satu per satu:

---

### 1A. Schema Awal (jika database masih kosong)

Jalankan file `supabase/migrations/001_initial_schema.sql` dari proyek kamu.

> Kalau tabel sudah ada (sudah pernah setup sebelumnya), **lewati 1A** dan langsung ke 1B.

---

### 1B. RLS Policies

Jalankan file `supabase/migrations/002_rls_policies.sql`.

> RLS wajib aktif agar data tiap user terisolasi dan aman.

---

### 1C. Fix Trigger & Robustness

Jalankan file `supabase/migrations/003_fixes.sql`.

> Ini memperbaiki trigger `handle_new_user` agar tidak crash saat data metadata tidak lengkap.

---

### 1D. Fix Data yang Sudah Ada (jika ada user lama yang profilenya tidak lengkap)

Jalankan file `supabase/migrations/004_fix_missing_profiles.sql`.

> Mengisi `employer_profiles` dan `mahasiswa_profiles` yang kosong untuk user lama.

---

### 1E. ⚠️ SQL Tambahan (WAJIB untuk fitur baru)

SQL ini **diperlukan** oleh perbaikan kode yang baru. Salin dan jalankan di SQL Editor:

```sql
-- Pastikan kolom updated_at ada di employer_profiles
-- (mungkin sudah ada, tidak masalah kalau dijalankan ulang)
ALTER TABLE employer_profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE mahasiswa_profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Tambahkan trigger auto-update updated_at untuk employer_profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_employer_profiles_updated_at ON employer_profiles;
CREATE TRIGGER set_employer_profiles_updated_at
  BEFORE UPDATE ON employer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_mahasiswa_profiles_updated_at ON mahasiswa_profiles;
CREATE TRIGGER set_mahasiswa_profiles_updated_at
  BEFORE UPDATE ON mahasiswa_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## LANGKAH 2 — Buat Storage Bucket

Buka **Storage** di sidebar kiri.

### Bucket 1: `avatars` (untuk foto profil)
1. Klik **New Bucket**
2. Name: `avatars`
3. Centang **Public bucket** → ON
4. Klik **Save**

### Bucket 2: `verification-docs` (untuk dokumen verifikasi employer)
1. Klik **New Bucket**
2. Name: `verification-docs`
3. **Public bucket** → OFF (biarkan private)
4. Klik **Save**

> Kalau bucket sudah ada, lewati bagian ini.

---

## LANGKAH 3 — Policies Storage

Setelah bucket dibuat, tambahkan policies berikut via **SQL Editor**:

```sql
-- Policies untuk bucket avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policies untuk bucket verification-docs
CREATE POLICY "Employers can upload verification docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Employers can view own verification docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin dapat melihat semua verification docs
CREATE POLICY "Admin can view all verification docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-docs'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

> Kalau muncul error "policy already exists", berarti sudah ada — tidak masalah, lanjutkan.

---

## LANGKAH 4 — Isi file `.env.local`

Buka **Project Settings → API** di Supabase Dashboard, lalu isi file `.env.local` di root proyek kamu:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

| Variable | Ambil dari |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role key |

> ⚠️ **Jangan commit** `SUPABASE_SERVICE_ROLE_KEY` ke Git. Tambahkan `.env.local` ke `.gitignore`.

---

## LANGKAH 5 — Buat Akun Admin

Admin tidak bisa daftar lewat halaman Register biasa. Caranya:

1. Daftar akun biasa lewat `/register` dengan role **Mahasiswa**
2. Buka **SQL Editor** di Supabase, jalankan:

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'email-admin-kamu@contoh.com'
);
```

3. Login ulang dengan akun tersebut — akan masuk ke `/dashboard/admin`

---

## LANGKAH 6 — Verifikasi Akhir

Cek di **Table Editor** bahwa tabel-tabel ini sudah ada:

| Tabel | Keterangan |
|---|---|
| `profiles` | Data user (role, nama, avatar) |
| `mahasiswa_profiles` | Detail profil mahasiswa |
| `employer_profiles` | Detail profil perusahaan |
| `jobs` | Lowongan kerja |
| `applications` | Lamaran masuk |
| `reviews` | Ulasan dari mahasiswa |
| `verification_requests` | Pengajuan verifikasi employer |
| `categories` | Kategori lowongan (sudah terisi otomatis) |

Kalau semua tabel ada dan `.env.local` sudah terisi → proyek siap dijalankan dengan `npm run dev`.

---

## ❓ Troubleshooting Umum

**Login langsung kembali ke halaman login?**
→ Pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di `.env.local` sudah benar.

**Profil tidak tersimpan / data tidak muncul?**
→ Cek RLS di **Authentication → Policies** — pastikan semua policy dari migration 002 sudah ada.

**Upload dokumen verifikasi gagal?**
→ Pastikan bucket `verification-docs` sudah dibuat dan policies storage sudah dijalankan.

**Employer tidak bisa lihat pelamar?**
→ Pastikan migration 002 sudah dijalankan, khususnya policy `"Employer can view applications for own jobs"`.

