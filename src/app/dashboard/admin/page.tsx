// src/app/dashboard/admin/page.tsx
// GANTI file lama dengan ini — ditambah data pemasukan dari tabel payments

import GrowthChart from "@/components/GrowthChart"
import RevenueCard from "@/components/RevenueCard"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import StatsCard from "@/components/StatsCard"
import Link from "next/link"
import { Users, Briefcase, CheckSquare, AlertTriangle, ArrowRight } from "lucide-react"

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "admin") {
    if (profile?.role === "employer") redirect("/dashboard/employer")
    else redirect("/dashboard/mahasiswa")
  }

  const adminSupabase = createAdminClient()

  const [
    { count: totalUsers },
    { count: totalJobs },
    { count: pendingJobs },
    { count: pendingVerifications },
    { data: recentUsers },
    { data: pendingJobsList },
    { data: pendingVerifList },
    { data: growthProfiles },
    { data: growthJobs },
    { data: growthApplications },
    // === BARU: data pemasukan ===
    { data: revenueData },
  ] = await Promise.all([
    adminSupabase.from("profiles").select("*", { count: "exact", head: true }),
    adminSupabase.from("jobs").select("*", { count: "exact", head: true }),
    adminSupabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "pending"),
    adminSupabase.from("verification_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    adminSupabase.from("profiles").select("id, full_name, role, created_at").order("created_at", { ascending: false }).limit(5),
    adminSupabase
      .from("jobs")
      .select(`id, judul, created_at, employer:profiles!jobs_employer_id_fkey(full_name, employer_profile:employer_profiles!employer_profiles_user_id_fkey(nama_perusahaan))`)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    adminSupabase
      .from("verification_requests")
      .select(`id, created_at, employer:profiles!verification_requests_employer_id_fkey(full_name, employer_profile:employer_profiles!employer_profiles_user_id_fkey(nama_perusahaan))`)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    adminSupabase.from("profiles").select("created_at, role").gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    adminSupabase.from("jobs").select("created_at").gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    adminSupabase.from("applications").select("applied_at").gte("applied_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    // Query ke view revenue_summary yang sudah dibuat di SQL migration
    adminSupabase.from("revenue_summary").select("*").maybeSingle(),
  ])

  const rev = revenueData as any

  const roleColor: Record<string, string> = {
    mahasiswa: "bg-blue-100 text-blue-700",
    employer:  "bg-purple-100 text-purple-700",
    admin:     "bg-red-100 text-red-700",
  }
  const roleLabel: Record<string, string> = {
    mahasiswa: "Mahasiswa",
    employer:  "Employer",
    admin:     "Admin",
  }

  // Format tanggal pakai Asia/Jakarta eksplisit — aman di server mana pun (Railway/Vercel/dll)
  const toJakartaDate = (d: Date): string =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(d)

  const today = new Date()
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (29 - i))
    return toJakartaDate(d)
  }).map((date) => ({
    date,
    mahasiswa: (growthProfiles ?? []).filter((p: any) => toJakartaDate(new Date(p.created_at)) === date && p.role === "mahasiswa").length,
    employer:  (growthProfiles ?? []).filter((p: any) => toJakartaDate(new Date(p.created_at)) === date && p.role === "employer").length,
    jobs:      (growthJobs ?? []).filter((j: any) => toJakartaDate(new Date(j.created_at)) === date).length,
    applications: (growthApplications ?? []).filter((a: any) => toJakartaDate(new Date(a.applied_at)) === date).length,
  }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
        <p className="text-slate-600 mt-1">Ringkasan aktivitas platform Partimeku.</p>
      </div>

      <div className="mb-10">
        <GrowthChart data={chartData} />
      </div>

      {/* Stats grid — RevenueCard sekarang span full row */}
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatsCard title="Total Pengguna"      value={String(totalUsers ?? 0)}         icon={Users} />
        <StatsCard title="Total Lowongan"      value={String(totalJobs ?? 0)}           icon={Briefcase} />
        <StatsCard title="Lowongan Menunggu"   value={String(pendingJobs ?? 0)}         icon={CheckSquare} />
        <StatsCard title="Verifikasi Menunggu" value={String(pendingVerifications ?? 0)} icon={AlertTriangle} />
      </div>

      {/* Revenue card — full width row sendiri */}
      <div className="mb-10">
        <RevenueCard
          totalPemasukan={Number(rev?.total_pemasukan ?? 0)}
          pemasukkanBulanIni={Number(rev?.pemasukan_bulan_ini ?? 0)}
          pemasukkanBulanLalu={Number(rev?.pemasukan_bulan_lalu ?? 0)}
          menungguKonfirmasi={Number(rev?.menunggu_konfirmasi ?? 0)}
          totalTransaksi={Number(rev?.total_transaksi ?? 0)}
        />
      </div>

      {/* Tabel bawah — sama persis dengan sebelumnya */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Lowongan Perlu Disetujui</h2>
            <Link href="/dashboard/admin/lowongan" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {(pendingJobsList ?? []).length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">Tidak ada lowongan yang perlu disetujui.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {(pendingJobsList ?? []).map((job: any) => (
                  <div key={job.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900">{job.judul}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {(job.employer as any)?.employer_profile?.nama_perusahaan || (job.employer as any)?.full_name || "Employer"} •{" "}
                        {new Date(job.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <Link href="/dashboard/admin/lowongan" className="text-sm font-medium text-blue-600 hover:underline">Tinjau</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Verifikasi Employer</h2>
            <Link href="/dashboard/admin/verifikasi" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {(pendingVerifList ?? []).length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">Tidak ada permintaan verifikasi.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {(pendingVerifList ?? []).map((v: any) => (
                  <div key={v.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {(v.employer as any)?.employer_profile?.nama_perusahaan || (v.employer as any)?.full_name || "Employer"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(v.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <Link href="/dashboard/admin/verifikasi" className="text-sm font-medium text-blue-600 hover:underline">Tinjau</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Pengguna Terbaru</h2>
            <Link href="/dashboard/admin/users" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {(recentUsers ?? []).length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">Belum ada pengguna.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {(recentUsers ?? []).map((u: any) => (
                  <div key={u.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900">{u.full_name || "Tanpa Nama"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Bergabung {new Date(u.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColor[u.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {roleLabel[u.role] ?? u.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
