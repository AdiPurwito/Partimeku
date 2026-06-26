import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building, MapPin, Calendar, Star } from "lucide-react"
import StatusBadge from "@/components/StatusBadge"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"

export default async function LamaranPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const { tab } = await searchParams
  const activeTab = tab ?? "semua"

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Step 1: Fetch applications tanpa nested join ke jobs (hindari RLS jobs block)
  const { data: applications } = await supabase
    .from("applications")
    .select(`
      id,
      status,
      applied_at,
      job_id,
      review:reviews!reviews_application_id_fkey (
        id
      )
    `)
    .eq("mahasiswa_id", user.id)
    .order("applied_at", { ascending: false })

  const apps = applications ?? []

  // Step 2: Fetch job details pakai admin client agar bypass RLS
  // (mahasiswa tidak bisa baca jobs dengan status selain 'approved' via RLS biasa)
  const adminClient = createAdminClient()
  const jobIds = [...new Set(apps.map((a: any) => a.job_id).filter(Boolean))]
  let jobMap: Record<string, any> = {}

  if (jobIds.length > 0) {
    const { data: jobs } = await adminClient
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

  const ApplicationCard = ({ app }: { app: any }) => {
    const hasReview = app.review && app.review.length > 0
    const judulLowongan = app.job?.judul ?? "Lowongan tidak tersedia"
    const namaPerusahaan = app.job?.employer_profile?.nama_perusahaan ?? "Perusahaan tidak diketahui"
    const lokasiLowongan = app.job?.lokasi ?? null

    return (
      <Card className="mb-4 border border-slate-200 shadow-sm overflow-hidden hover:border-blue-300 transition-colors">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6">
            <div className="flex-1">
              {/* Judul & Status (mobile) */}
              <div className="flex items-center justify-between sm:justify-start mb-1 gap-4">
                <h3 className="font-bold text-lg text-slate-900">{judulLowongan}</h3>
                <div className="sm:hidden">
                  <StatusBadge status={app.status as any} />
                </div>
              </div>

              {/* Nama perusahaan */}
              <div className="flex items-center gap-1.5 mb-3">
                <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700">{namaPerusahaan}</span>
              </div>

              {/* Meta info: lokasi & waktu lamar */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                {lokasiLowongan && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{lokasiLowongan}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>Dilamar {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true, locale: id })}</span>
                </div>
              </div>
            </div>

            {/* Kanan: Status badge & tombol aksi */}
            <div className="flex flex-col sm:items-end w-full sm:w-auto gap-3 border-t sm:border-t-0 border-slate-100 pt-4 sm:pt-0 mt-4 sm:mt-0 sm:ml-6">
              <div className="hidden sm:block">
                <StatusBadge status={app.status as any} />
              </div>

              {app.status === "diterima" && !hasReview && (
                <Link href={`/dashboard/mahasiswa/ulasan/${app.id}`}>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800">
                    <Star className="w-4 h-4 mr-1.5 fill-blue-700 text-blue-700" /> Beri Ulasan
                  </Button>
                </Link>
              )}

              {app.job?.id && (
                <Link href={`/jobs/${app.job.id}`}>
                  <Button size="sm" variant="ghost" className="w-full sm:w-auto text-slate-500 hover:text-slate-700">
                    Lihat Detail Lowongan →
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const tabs = [
    { key: "semua", label: "Semua", apps: allApps },
    { key: "menunggu", label: "Menunggu", apps: allApps.filter((a: any) => a.status === "menunggu") },
    { key: "diterima", label: "Diterima", apps: allApps.filter((a: any) => a.status === "diterima") },
    { key: "ditolak", label: "Ditolak", apps: allApps.filter((a: any) => a.status === "ditolak") },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Lamaran Saya</h1>
        <p className="text-slate-600 mt-1">Pantau status lamaran kerja part-time Anda.</p>
      </div>

      {/* Simple Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/dashboard/mahasiswa/lamaran?tab=${tab.key}`}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
              {tab.apps.length}
            </span>
          </Link>
        ))}
      </div>

      {allApps.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="font-medium text-lg">Belum ada lamaran</p>
          <p className="text-sm mt-1">Yuk cari lowongan kerja dan mulai melamar!</p>
          <Link href="/jobs">
            <Button className="mt-4">Cari Lowongan</Button>
          </Link>
        </div>
      ) : (
        <div>
          {tabs
            .find((t) => t.key === activeTab)?.apps
            .map((app: any) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          {(tabs.find((t) => t.key === activeTab)?.apps.length ?? 0) === 0 && allApps.length > 0 && (
            <div className="text-center py-12 text-slate-500">
              <p className="font-medium">Tidak ada lamaran dengan status ini.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
