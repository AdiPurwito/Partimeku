-- ============================================
-- Partimeku Database Schema
-- Migration 001: Initial Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. Profiles (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name VARCHAR(150),
  avatar_url TEXT,
  role TEXT CHECK (role IN ('mahasiswa', 'employer', 'admin')) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup (trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'full_name'
  );

  -- Auto-create role-specific profile
  IF NEW.raw_user_meta_data->>'role' = 'mahasiswa' THEN
    INSERT INTO public.mahasiswa_profiles (user_id)
    VALUES (NEW.id);
  ELSIF NEW.raw_user_meta_data->>'role' = 'employer' THEN
    INSERT INTO public.employer_profiles (user_id, nama_perusahaan)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'nama_perusahaan');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 2. Mahasiswa Profiles
-- ============================================
CREATE TABLE mahasiswa_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  universitas VARCHAR(100),
  jurusan VARCHAR(100),
  semester SMALLINT,
  no_hp VARCHAR(20),
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Employer Profiles
-- ============================================
CREATE TABLE employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  nama_perusahaan VARCHAR(150),
  bidang_usaha VARCHAR(100),
  deskripsi TEXT,
  alamat VARCHAR(255),
  website VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Categories
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(100) NOT NULL
);

-- Seed categories
INSERT INTO categories (nama) VALUES
  ('Teknologi & IT'),
  ('Marketing & Sales'),
  ('Desain & Kreatif'),
  ('Administrasi'),
  ('Pendidikan & Tutor'),
  ('Logistik & Kurir'),
  ('F&B & Hospitality'),
  ('Lainnya');

-- ============================================
-- 5. Jobs
-- ============================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  judul VARCHAR(150) NOT NULL,
  deskripsi TEXT NOT NULL,
  kualifikasi TEXT,
  lokasi VARCHAR(100),
  tipe_kerja TEXT CHECK (tipe_kerja IN ('remote', 'onsite', 'hybrid')),
  gaji_min BIGINT,
  gaji_max BIGINT,
  deadline DATE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  alasan_reject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. Applications
-- ============================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  mahasiswa_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('menunggu', 'diterima', 'ditolak')) DEFAULT 'menunggu',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, mahasiswa_id)
);

-- ============================================
-- 7. Reviews
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  employer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mahasiswa_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  komentar TEXT,
  is_reported BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: update avg_rating & total_reviews on employer_profiles
CREATE OR REPLACE FUNCTION update_employer_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_employer_id UUID;
BEGIN
  target_employer_id := COALESCE(NEW.employer_id, OLD.employer_id);

  UPDATE employer_profiles
  SET
    avg_rating = (
      SELECT COALESCE(AVG(rating)::NUMERIC(3,2), 0)
      FROM reviews
      WHERE employer_id = target_employer_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE employer_id = target_employer_id
    )
  WHERE user_id = target_employer_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_employer_rating();

-- ============================================
-- 8. Verification Requests
-- ============================================
CREATE TABLE verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  dokumen_url TEXT NOT NULL,
  catatan_pengaju TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  catatan_admin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- ============================================
-- 9. Storage Buckets (run via Supabase Dashboard or API)
-- ============================================
-- Public bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Private bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
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

-- Storage policies for verification-docs bucket
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
