-- ============================================
-- Partimeku Fix Migration 003
-- Fixes: admin role setup, trigger robustness
-- ============================================

-- Fix trigger: handle case when role is NULL (e.g. admin created manually via Supabase Dashboard)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_full_name TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'mahasiswa');
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

  -- Insert base profile (upsert to avoid duplicate on re-trigger)
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, user_role, user_full_name)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

  -- Auto-create role-specific sub-profile
  IF user_role = 'mahasiswa' THEN
    INSERT INTO public.mahasiswa_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF user_role = 'employer' THEN
    INSERT INTO public.employer_profiles (user_id, nama_perusahaan)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'nama_perusahaan')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  -- admin: no sub-profile needed

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SQL to promote a user to admin role
-- Run this in Supabase SQL Editor after creating
-- the account via the website as "mahasiswa":
--
--   UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid-here>';
--
-- Or if you know the email:
--
--   UPDATE profiles
--   SET role = 'admin'
--   WHERE id = (
--     SELECT id FROM auth.users WHERE email = 'admin@example.com'
--   );
-- ============================================
