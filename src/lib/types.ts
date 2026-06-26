export type UserRole = 'mahasiswa' | 'employer' | 'admin'

export type JobStatus = 'pending' | 'approved' | 'rejected'
export type ApplicationStatus = 'menunggu' | 'diterima' | 'ditolak'
export type TipeKerja = 'remote' | 'onsite' | 'hybrid'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface MahasiswaProfile {
  id: string
  user_id: string
  universitas: string | null
  jurusan: string | null
  semester: number | null
  no_hp: string | null
  bio: string | null
  created_at: string
  updated_at: string
  skills: string[] | null
}

export interface EmployerProfile {
  id: string
  user_id: string
  nama_perusahaan: string | null
  bidang_usaha: string | null
  deskripsi: string | null
  alamat: string | null
  website: string | null
  is_verified: boolean
  verified_at: string | null
  avg_rating: number
  total_reviews: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  nama: string
}

export interface Job {
  id: string
  employer_id: string
  category_id: string | null
  judul: string
  deskripsi: string
  kualifikasi: string | null
  lokasi: string | null
  tipe_kerja: TipeKerja | null
  gaji_min: number | null
  gaji_max: number | null
  deadline: string | null
  status: JobStatus
  alasan_reject: string | null
  created_at: string
  // Joined data
  employer_profile?: EmployerProfile
  employer?: Profile
  category?: Category
}

export interface Application {
  id: string
  job_id: string
  mahasiswa_id: string
  status: ApplicationStatus
  applied_at: string
  // Joined data
  job?: Job
  mahasiswa?: Profile
  mahasiswa_profile?: MahasiswaProfile
  review?: Review
}

export interface Review {
  id: string
  application_id: string
  employer_id: string
  mahasiswa_id: string
  rating: number
  komentar: string | null
  is_reported: boolean
  created_at: string
  updated_at: string
  // Joined data
  mahasiswa?: Profile
  mahasiswa_profile?: MahasiswaProfile
}

export interface VerificationRequest {
  id: string
  employer_id: string
  dokumen_url: string
  catatan_pengaju: string | null
  status: VerificationStatus
  catatan_admin: string | null
  created_at: string
  reviewed_at: string | null
  // Joined data
  employer?: Profile
  employer_profile?: EmployerProfile
}

// Helper types for forms
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  role: 'mahasiswa' | 'employer'
  full_name: string
  nama_perusahaan?: string
}

export interface JobFormData {
  judul: string
  deskripsi: string
  kualifikasi: string
  category_id: string
  lokasi: string
  tipe_kerja: TipeKerja
  gaji_min: number | null
  gaji_max: number | null
  deadline: string
}

export interface ReviewFormData {
  rating: number
  komentar?: string
}

export interface MahasiswaProfileFormData {
  full_name: string
  universitas: string
  jurusan: string
  semester: number
  no_hp: string
  bio: string
}

export interface EmployerProfileFormData {
  nama_perusahaan: string
  bidang_usaha: string
  deskripsi: string
  alamat: string
  website: string
}

// Stats type for dashboards
export interface PlatformStats {
  totalJobs: number
  totalMahasiswa: number
  totalEmployer: number
  totalApplications: number
  pendingJobs: number
  approvedJobs: number
  rejectedJobs: number
  pendingVerifications: number
}
