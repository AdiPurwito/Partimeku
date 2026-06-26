-- Fix: Mahasiswa harus bisa melihat jobs yang sudah pernah dilamarnya,
-- meskipun status job bukan 'approved' (misal pending/draft).
-- Tanpa policy ini, nested join applications -> jobs akan return null
-- dan menyebabkan data lamaran tidak tampil di dashboard mahasiswa.

CREATE POLICY "Mahasiswa can view jobs they applied to"
  ON jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.job_id = jobs.id
        AND applications.mahasiswa_id = auth.uid()
    )
  );