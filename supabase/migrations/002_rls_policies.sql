-- ============================================
-- Partimeku Row Level Security Policies
-- Migration 002: RLS Policies
-- ============================================

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mahasiswa_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Categories (public read)
-- ============================================
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

-- ============================================
-- Profiles
-- ============================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Public can view basic profile info (for job listings, reviews display)
CREATE POLICY "Public can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Admin can view all profiles
CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update any profile
CREATE POLICY "Admin can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Mahasiswa Profiles
-- ============================================
CREATE POLICY "Users can view own mahasiswa profile"
  ON mahasiswa_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own mahasiswa profile"
  ON mahasiswa_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mahasiswa profile"
  ON mahasiswa_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Employers can view mahasiswa profiles (for pelamar review)
CREATE POLICY "Public can view mahasiswa profiles"
  ON mahasiswa_profiles FOR SELECT
  USING (true);

-- ============================================
-- Employer Profiles
-- ============================================
CREATE POLICY "Users can view own employer profile"
  ON employer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own employer profile"
  ON employer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own employer profile"
  ON employer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public can view employer profiles (for job detail, reviews)
CREATE POLICY "Public can view employer profiles"
  ON employer_profiles FOR SELECT
  USING (true);

-- ============================================
-- Jobs
-- ============================================
-- Public can view approved jobs
CREATE POLICY "Public can view approved jobs"
  ON jobs FOR SELECT
  USING (status = 'approved');

-- Employer can view all own jobs (any status)
CREATE POLICY "Employer can view own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = employer_id);

-- Employer can insert jobs
CREATE POLICY "Employer can insert jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = employer_id);

-- Employer can update own jobs
CREATE POLICY "Employer can update own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = employer_id);

-- Employer can delete own jobs
CREATE POLICY "Employer can delete own jobs"
  ON jobs FOR DELETE
  USING (auth.uid() = employer_id);

-- Admin can view all jobs
CREATE POLICY "Admin can view all jobs"
  ON jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update any job (approve/reject)
CREATE POLICY "Admin can update any job"
  ON jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Applications
-- ============================================
-- Mahasiswa can view own applications
CREATE POLICY "Mahasiswa can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = mahasiswa_id);

-- Mahasiswa can insert application
CREATE POLICY "Mahasiswa can insert application"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = mahasiswa_id);

-- Employer can view applications for their jobs
CREATE POLICY "Employer can view applications for own jobs"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.employer_id = auth.uid()
    )
  );

-- Employer can update application status
CREATE POLICY "Employer can update application status"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.employer_id = auth.uid()
    )
  );

-- Admin can view all applications
CREATE POLICY "Admin can view all applications"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Reviews
-- ============================================
-- Public can view all reviews
CREATE POLICY "Public can view reviews"
  ON reviews FOR SELECT
  USING (true);

-- Mahasiswa can insert own review
CREATE POLICY "Mahasiswa can insert own review"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = mahasiswa_id);

-- Mahasiswa can update own review within 7 days
CREATE POLICY "Mahasiswa can update own review within 7 days"
  ON reviews FOR UPDATE
  USING (
    auth.uid() = mahasiswa_id
    AND created_at > NOW() - INTERVAL '7 days'
  );

-- Admin can delete reviews (moderasi)
CREATE POLICY "Admin can delete reviews"
  ON reviews FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update reviews (set is_reported)
CREATE POLICY "Admin can update reviews"
  ON reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Verification Requests
-- ============================================
-- Employer can view own verification requests
CREATE POLICY "Employer can view own verification requests"
  ON verification_requests FOR SELECT
  USING (auth.uid() = employer_id);

-- Employer can insert verification request
CREATE POLICY "Employer can insert verification request"
  ON verification_requests FOR INSERT
  WITH CHECK (auth.uid() = employer_id);

-- Admin can view all verification requests
CREATE POLICY "Admin can view all verification requests"
  ON verification_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update verification requests
CREATE POLICY "Admin can update verification requests"
  ON verification_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );


