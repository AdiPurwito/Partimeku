# Partimeku — Panduan Integrasi Monetisasi

Konsep simpel: **paket Free (5 lowongan) vs Pro (unlimited, Rp 20.000/bulan)**, 
pembayaran manual transfer, konfirmasi oleh admin.

---

## 📁 File yang Perlu Diintegrasikan

| File Baru | Taruh Di |
|---|---|
| `008_monetisasi.sql` | Jalankan di Supabase SQL Editor |
| `RevenueCard.tsx` | `src/components/RevenueCard.tsx` |
| `admin-page.tsx` | **Ganti** `src/app/dashboard/admin/page.tsx` |
| `admin-payments/page.tsx` | `src/app/dashboard/admin/payments/page.tsx` |
| `admin-payments/ConfirmPaymentButton.tsx` | `src/app/dashboard/admin/payments/ConfirmPaymentButton.tsx` |
| `upgrade/page.tsx` | `src/app/dashboard/employer/upgrade/page.tsx` |
| `upgrade/UpgradeForm.tsx` | `src/app/dashboard/employer/upgrade/UpgradeForm.tsx` |
| `lowongan-buat/page.tsx` | **Ganti** `src/app/dashboard/employer/lowongan/buat/page.tsx` |

---

## 🔧 Langkah Integrasi

### 1. Jalankan SQL Migration
Buka **Supabase → SQL Editor**, paste isi `008_monetisasi.sql`, lalu **Run**.

Ini akan:
- Tambah kolom `plan` dan `plan_expires_at` ke `employer_profiles`
- Buat tabel `payments`
- Buat function `confirm_payment()` (dipanggil admin via tombol)
- Buat view `revenue_summary` (dipakai RevenueCard di dashboard admin)

### 2. Tambah Storage Bucket (opsional, untuk bukti transfer)
Kalau mau employer bisa upload foto bukti transfer nanti:
```
Supabase → Storage → New Bucket → nama: "payment-proofs" → Public: true
```
MVP awal tanpa upload juga oke — form hanya pakai kolom catatan.

### 3. Tambah Link Sidebar
Di `src/app/dashboard/layout.tsx`, tambahkan ke `employerLinks`:
```ts
{ href: "/dashboard/employer/upgrade", label: "Upgrade ke Pro", icon: Crown },
```
Dan ke `adminLinks`:
```ts
{ href: "/dashboard/admin/payments", label: "Kelola Pembayaran", icon: CircleDollarSign },
```
Import ikonnya dari `lucide-react`.

---

## 🔄 Alur Kerja

```
Employer lihat kuota penuh
  → klik "Upgrade ke Pro"
  → pilih durasi, isi catatan sudah transfer
  → klik kirim → record masuk ke tabel payments (status: pending)

Admin buka /dashboard/admin/payments
  → lihat daftar pending
  → verifikasi manual (cek mutasi rekening)
  → klik "Konfirmasi Lunas"
  → function confirm_payment() jalan:
      payments.status = 'lunas'
      employer_profiles.plan = 'pro'
      employer_profiles.plan_expires_at = sekarang + N bulan

RevenueCard di dashboard admin
  → baca dari VIEW revenue_summary (otomatis update)
  → tampil: total all-time, bulan ini, tren vs bulan lalu, pending
```

---

## 💰 Logika Kuota Lowongan

Di `lowongan/buat/page.tsx` (server component):
- Cek `employer_profiles.plan` dan `plan_expires_at`
- Kalau Pro & belum expired → langsung boleh buat (unlimited)
- Kalau Free → hitung `jobs` dengan status `pending/approved`
- Kalau sudah ≥ 5 → tampilkan halaman blokir + tombol Upgrade
- Kalau masih < 5 → tampilkan form + banner sisa kuota

---

## 📊 RevenueCard di Dashboard Admin

Card ini **full-width** (span 4 kolom) dan menampilkan:
- **Total Semua Waktu** — akumulasi semua transaksi lunas
- **Bulan Ini** — pemasukan bulan berjalan + tren % vs bulan lalu
- **Menunggu Konfirmasi** — jumlah payment pending (dengan animasi pulse kalau ada)

Data dari `VIEW revenue_summary` — tinggal query `.from("revenue_summary").select("*").single()`.
