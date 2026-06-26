import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import StatsCard from "@/components/StatsCard"
import Link from "next/link"
import { Briefcase, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function MahasiswaDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle()

  // Guard: jika bukan mahasiswa, redirect ke dashboard sesuai role
  if (profile?.role === "employer") redirect("/dashboard/employer")
  if (profile?.role === "admin") redirect("/dashboard/admin")

  // Step 1: Fetch applications tanpa nested join ke jobs (hindari RLS jobs block)
  const { data: applications, error: appsError } = await supabase
    .from("applications")
    .select("id, status, applied_at, job_id")
    .eq("mahasiswa_id", user.id)
    .order("applied_at", { ascending: false })

  const apps = applications ?? []

  // Step 2: Fetch job details terpisah
  const jobIds = [...new Set(apps.map((a: any) => a.job_id).filter(Boolean))]
  let jobMap: Record<string, any> = {}

  if (jobIds.length > 0) {
    const { data: jobs } = await supabase
      .from("jobs")
      .select(`
        id,
        judul,
        lokasi,
        employer_profile:employer_profiles!employer_profiles_user_id_fkey (
          nama_perusahaan
        )
      `)
      .in("id", jobIds)

    for (const j of jobs ?? []) {
      jobMap[j.id] = j
    }
  }

  const allApps = apps.map((app: any) => ({
    ...app,
    job: jobMap[app.job_id] ?? null,
  }))
  const totalLamaran = allApps.length
  const menunggu = allApps.filter((a) => a.status === "menunggu").length
  const diterima = allApps.filter((a) => a.status === "diterima").length
  const ditolak = allApps.filter((a) => a.status === "ditolak").length

  // Fetch recommended jobs (latest approved jobs)
  const { data: recommendedJobs } = await supabase
    .from("jobs")
    .select(`
      id,
      judul,
      lokasi,
      gaji_min,
      gaji_max,
      tipe_kerja,
      employer_profile:employer_profiles!employer_profiles_user_id_fkey (
        nama_perusahaan
      )
    `)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(3)

  const formatGaji = (min: number | null, max: number | null) => {
    if (!min && !max) return "Gaji tidak disebutkan"
    const fmt = (n: number) =>
      new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
    if (min && max) return `${fmt(min)} – ${fmt(max)}`
    if (min) return `Mulai ${fmt(min)}`
    return `Hingga ${fmt(max!)}`
  }

  const statusLabel: Record<string, { text: string; color: string }> = {
    menunggu: { text: "Menunggu Review", color: "bg-yellow-100 text-yellow-700" },
    diterima: { text: "Diterima", color: "bg-green-100 text-green-700" },
    ditolak: { text: "Ditolak", color: "bg-red-100 text-red-700" },
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Halo, {profile?.full_name || "Mahasiswa"} 👋
        </h1>
        <p className="text-slate-600 mt-1">Pantau aktivitas lamaran dan temukan pekerjaan yang cocok untukmu.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatsCard title="Total Lamaran" value={String(totalLamaran)} icon={Briefcase} />
        <StatsCard title="Menunggu Review" value={String(menunggu)} icon={Clock} />
        <StatsCard title="Diterima" value={String(diterima)} icon={CheckCircle2} />
        <StatsCard title="Ditolak" value={String(ditolak)} icon={XCircle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lamaran Terbaru */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Status Lamaran Terbaru</h2>
            <Link href="/dashboard/mahasiswa/lamaran" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {allApps.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">Belum ada lamaran</p>
                <p className="text-sm mt-1">Yuk cari lowongan kerja dan mulai melamar!</p>
                <Link href="/jobs">
                  <Button className="mt-4" size="sm">Cari Lowongan</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {allApps.slice(0, 5).map((app: any) => {
                  const status = statusLabel[app.status] ?? { text: app.status, color: "bg-slate-100 text-slate-600" }
                  const companyName =
                    app.job?.employer_profile?.nama_perusahaan ||
                    app.job?.employer?.full_name ||
                    "Perusahaan"
                  return (
                    <div key={app.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{app.job?.judul ?? "Lowongan"}</p>
                        <p className="text-sm text-slate-500">{companyName} • {app.job?.lokasi ?? "-"}</p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rekomendasi Pekerjaan */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Lowongan Terbaru</h2>
            <Link href="/jobs" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Semua
            </Link>
          </div>

          <div className="space-y-4">
            {(recommendedJobs ?? []).length === 0 ? (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center text-slate-500 text-sm">
                Belum ada lowongan tersedia.
              </div>
            ) : (
              (recommendedJobs ?? []).map((job: any) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="block bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 hover:border-blue-300 transition-colors">
                  <div>
                    <h3 className="font-bold text-slate-900">{job.judul}</h3>
                    <p className="text-sm text-slate-500">
                      {job.employer_profile?.nama_perusahaan ?? "Perusahaan"} • {job.lokasi ?? "Lokasi tidak disebutkan"}
                    </p>
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    {formatGaji(job.gaji_min, job.gaji_max)}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
