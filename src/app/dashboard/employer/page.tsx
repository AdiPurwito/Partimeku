import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import StatsCard from "@/components/StatsCard"
import { Briefcase, Users, Eye, Plus, ArrowRight, Clock, ShieldAlert, Crown, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Harus selalu sama dengan BATAS_FREE di lowongan/buat/page.tsx
const BATAS_FREE = 5

export default async function EmployerDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Guard: only employer
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role === "mahasiswa") redirect("/dashboard/mahasiswa")
  if (profile?.role === "admin") redirect("/dashboard/admin")

  // Cek status approval akun + plan employer
  const { data: ep } = await supabase
    .from("employer_profiles")
    .select("account_approved, plan, plan_expires_at")
    .eq("user_id", user.id)
    .maybeSingle()

  const isAccountApproved = ep?.account_approved === true

  const isPro =
    ep?.plan === "pro" &&
    (!ep?.plan_expires_at || new Date(ep.plan_expires_at) > new Date())

  // Fetch employer's own jobs (semua status — employer bisa lihat punyanya sendiri)
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id, judul, status, created_at")
    .eq("employer_id", user.id)
    .order("created_at", { ascending: false })

  if (jobsError) {
    console.error("[EmployerDashboard] jobs error:", jobsError)
  }

  const allJobs = jobs ?? []
  const activeJobs = allJobs.filter((j) => j.status === "approved").length
  const pendingJobs = allJobs.filter((j) => j.status === "pending").length

  // Fetch total applicants untuk semua job employer ini
  // Query langsung pakai employer_id via FK join — tidak bergantung pada
  // RLS policy applications yang nested ke jobs
  const jobIds = allJobs.map((j) => j.id)
  let totalApplicants = 0
  let recentApplications: any[] = []

  if (jobIds.length > 0) {
    // Query 1: total count
    const { count } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .in("job_id", jobIds)

    totalApplicants = count ?? 0

    // Query 2: recent applications dengan detail mahasiswa & job
    const { data: apps, error: appsError } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        applied_at,
        mahasiswa_id,
        job_id
      `)
      .in("job_id", jobIds)
      .order("applied_at", { ascending: false })
      .limit(5)

    if (appsError) {
      console.error("[EmployerDashboard] applications error:", appsError)
    }

    if (apps && apps.length > 0) {
      // Fetch mahasiswa names & job titles secara terpisah (lebih aman dari FK join RLS)
      const mahasiswaIds = [...new Set(apps.map((a) => a.mahasiswa_id))]
      const appJobIds = [...new Set(apps.map((a) => a.job_id))]

      const [{ data: mahasiswaProfiles }, { data: jobTitles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", mahasiswaIds),
        supabase
          .from("jobs")
          .select("id, judul")
          .in("id", appJobIds),
      ])

      const mahasiswaMap = Object.fromEntries(
        (mahasiswaProfiles ?? []).map((p: any) => [p.id, p.full_name])
      )
      const jobMap = Object.fromEntries(
        (jobTitles ?? []).map((j: any) => [j.id, j.judul])
      )

      recentApplications = apps.map((a) => ({
        ...a,
        mahasiswa_name: mahasiswaMap[a.mahasiswa_id] ?? "Pelamar",
        job_title: jobMap[a.job_id] ?? "Lowongan",
      }))
    }
  }

  const statusBadge: Record<string, string> = {
    approved: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
  }

  const statusLabel: Record<string, string> = {
    approved: "Aktif",
    pending: "Menunggu Approval",
    rejected: "Ditolak",
  }

  const appStatusBadge: Record<string, string> = {
    menunggu: "bg-yellow-100 text-yellow-700",
    diterima: "bg-green-100 text-green-700",
    ditolak: "bg-red-100 text-red-700",
  }

  const appStatusLabel: Record<string, string> = {
    menunggu: "Menunggu",
    diterima: "Diterima",
    ditolak: "Ditolak",
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Banner: akun menunggu approval */}
      {!isAccountApproved && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <Clock className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <p className="font-semibold">Akun Anda sedang menunggu verifikasi admin</p>
            <p className="text-amber-700 mt-0.5">
              Setelah disetujui, Anda dapat mulai membuat dan memposting lowongan. Proses biasanya 1×24 jam kerja.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Employer</h1>
          <p className="text-slate-600 mt-1">Kelola lowongan dan pantau perkembangan pelamar Anda.</p>
        </div>
        <Link
          href="/dashboard/employer/lowongan/buat"
          className={`inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 ${
            isAccountApproved
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none"
          }`}
          aria-disabled={!isAccountApproved}
        >
          <Plus className="w-4 h-4 mr-2" /> Buat Lowongan
        </Link>
      </div>

      {/* Card promosi Pro — hanya tampil kalau belum berlangganan Pro */}
      {!isPro && (
        <Link
          href="/dashboard/employer/upgrade"
          className="group mb-8 flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 transition-colors hover:border-blue-300"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Crown className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm">
                Posting lowongan tanpa batas dengan Pro
              </p>
              <p className="text-slate-500 text-xs mt-0.5 truncate">
                Anda di paket Free · {activeJobs + pendingJobs} dari {BATAS_FREE} lowongan aktif/pending terpakai
              </p>
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium px-3 py-2 group-hover:bg-blue-700 transition-colors">
            <Zap className="w-3.5 h-3.5" /> Upgrade Pro
          </span>
        </Link>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <StatsCard title="Lowongan Aktif" value={String(activeJobs)} icon={Briefcase} />
        <StatsCard title="Menunggu Persetujuan" value={String(pendingJobs)} icon={Eye} />
        <StatsCard title="Total Pelamar" value={String(totalApplicants)} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lowongan Saya */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Lowongan Saya</h2>
            <Link
              href="/dashboard/employer/lowongan"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {allJobs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">Belum ada lowongan</p>
                <Link href="/dashboard/employer/lowongan/buat">
                  <Button className="mt-4" size="sm">
                    Buat Lowongan Pertama
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {allJobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900">{job.judul}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(job.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        statusBadge[job.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {statusLabel[job.status] ?? job.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pelamar Terbaru */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Pelamar Terbaru</h2>
            <Link
              href="/dashboard/employer/pelamar"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {recentApplications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">Belum ada pelamar</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentApplications.map((app: any) => (
                  <div key={app.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{app.mahasiswa_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{app.job_title}</p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        appStatusBadge[app.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {appStatusLabel[app.status] ?? app.status}
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
