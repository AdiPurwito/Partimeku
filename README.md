<div align="center">
  <h1>🎓 Partimeku</h1>
  <p><strong>Platform Lowongan Part-time #1 untuk Mahasiswa Indonesia</strong></p>
  <p>Temukan pekerjaan sampingan yang fleksibel dan sesuai jadwal kuliahmu.</p>

  ![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
  ![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
  ![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)

  <br/>

  **[🌐 Live Demo](https://partimeku-app.vercel.app)** • **[📋 Lapor Bug](https://github.com/AdiPurwito/Partimeku/issues)**
</div>

---

## 📖 Tentang Partimeku

**Partimeku** adalah platform yang menghubungkan **mahasiswa Indonesia** dengan **perusahaan/employer** yang membutuhkan tenaga kerja paruh waktu. Mahasiswa dapat menemukan lowongan part-time yang sesuai jadwal kuliah, sementara employer dapat merekrut tenaga mahasiswa yang potensial.

---

## ✨ Fitur Utama

### 👨‍🎓 Untuk Mahasiswa
- 🔍 **Cari Lowongan** — Filter berdasarkan lokasi, kategori, tipe kerja (remote/onsite/hybrid), dan rentang gaji
- 📄 **Lamar Pekerjaan** — Proses lamaran langsung dari platform
- 📊 **Dashboard Lamaran** — Pantau status lamaran (menunggu/diterima/ditolak) secara real-time
- ⭐ **Beri Ulasan** — Berikan rating dan ulasan untuk employer setelah bekerja
- 👤 **Profil Lengkap** — Lengkapi profil dengan universitas, jurusan, semester, skills, dan bio

### 🏢 Untuk Employer
- 📝 **Posting Lowongan** — Buat dan kelola lowongan kerja part-time
- 👥 **Kelola Pelamar** — Review dan update status lamaran mahasiswa
- ✅ **Verifikasi Perusahaan** — Upload dokumen untuk verifikasi dan membangun kepercayaan
- 📈 **Dashboard Analytics** — Pantau statistik lowongan dan pelamar
- 💼 **Profil Perusahaan** — Tampilkan informasi perusahaan, rating, dan ulasan dari mahasiswa

### 🛡️ Untuk Admin
- 👁️ **Moderasi Lowongan** — Approve/reject lowongan yang diajukan employer
- ✔️ **Verifikasi Employer** — Review dokumen dan verifikasi perusahaan
- 👤 **Manajemen User** — Kelola dan nonaktifkan akun pengguna
- 💰 **Kelola Pembayaran** — Konfirmasi bukti pembayaran upgrade akun employer
- 📊 **Statistik Platform** — Pantau total job, mahasiswa, employer, dan lamaran

---

## 🛠️ Tech Stack

| Teknologi | Kegunaan |
|-----------|----------|
| **Next.js 16** (App Router) | Framework utama, SSR & SSG |
| **TypeScript** | Type safety |
| **Supabase** | Database PostgreSQL, Auth, Storage |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | Komponen UI |
| **React Hook Form + Zod** | Form handling & validasi |
| **Vercel** | Deployment & hosting |

---

## 🗂️ Struktur Proyek

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Halaman login
│   │   └── register/       # Halaman registrasi (mahasiswa/employer)
│   ├── jobs/
│   │   ├── page.tsx        # Daftar lowongan publik
│   │   └── [id]/
│   │       ├── page.tsx    # Detail lowongan
│   │       └── apply/      # Form lamaran
│   └── dashboard/
│       ├── mahasiswa/
│       │   ├── page.tsx    # Dashboard mahasiswa
│       │   ├── lamaran/    # Kelola lamaran
│       │   ├── profil/     # Edit profil mahasiswa
│       │   └── ulasan/     # Beri ulasan employer
│       ├── employer/
│       │   ├── page.tsx    # Dashboard employer
│       │   ├── lowongan/   # Kelola lowongan (CRUD)
│       │   ├── pelamar/    # Kelola pelamar
│       │   ├── profil/     # Edit profil perusahaan
│       │   ├── verifikasi/ # Upload dokumen verifikasi
│       │   └── upgrade/    # Upgrade akun employer
│       └── admin/
│           ├── page.tsx    # Dashboard admin
│           ├── users/      # Manajemen pengguna
│           ├── verifikasi/ # Approve verifikasi employer
│           └── payments/   # Konfirmasi pembayaran
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── ui/                 # Komponen shadcn/ui
└── lib/
    ├── supabase/           # Supabase client (server/client/admin)
    ├── types.ts            # TypeScript types
    └── utils.ts            # Utility functions
```

---

## 👥 Role & Akses

| Role | Deskripsi |
|------|-----------|
| **Mahasiswa** | Cari & lamar lowongan, beri ulasan |
| **Employer** | Post lowongan, kelola pelamar, verifikasi perusahaan |
| **Admin** | Moderasi konten, manajemen user, konfirmasi pembayaran |

---

## 🚀 Menjalankan Secara Lokal

### Prasyarat
- Node.js 18+
- Akun Supabase

### Instalasi

1. **Clone repository**
```bash
git clone https://github.com/AdiPurwito/Partimeku.git
cd Partimeku
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**

Buat file `.env.local` di root folder:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Setup database**

Jalankan migration di Supabase SQL Editor sesuai urutan file di folder `supabase/migrations/`.

5. **Jalankan development server**
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Database Schema

Platform menggunakan PostgreSQL via Supabase dengan tabel utama:
- `profiles` — Data pengguna & role
- `mahasiswa_profiles` — Profil lengkap mahasiswa
- `employer_profiles` — Profil perusahaan & rating
- `jobs` — Data lowongan pekerjaan
- `applications` — Data lamaran mahasiswa
- `reviews` — Ulasan dan rating employer
- `verification_requests` — Pengajuan verifikasi perusahaan
- `categories` — Kategori pekerjaan

---

## 📦 Deployment

Project ini di-deploy otomatis ke Vercel setiap kali ada push ke branch `main`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AdiPurwito/Partimeku)

---

## 👤 Developer

**Adi Purwito**
- GitHub: [@AdiPurwito](https://github.com/AdiPurwito)
- Live: [partimeku-app.vercel.app](https://partimeku-app.vercel.app)

---

<div align="center">
  <p>Dibuat dengan ❤️ untuk mahasiswa Indonesia</p>
</div>
