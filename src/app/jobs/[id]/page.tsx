import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, MapPin, DollarSign, Briefcase, Calendar, Building, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import VerifiedBadge from "@/components/VerifiedBadge"
import { formatRupiah, getTipeKerjaLabel } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import { createClient } from "@/lib/supabase/server"

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: jobId } = await params
  const supabase = await createClient()

  // Fetch job detail with employer info from database
  // IMPORTANT: jobs → employer_profiles has no direct FK.
  // Must go through profiles: jobs → profiles (jobs_employer_id_fkey) → employer_profiles
  const { data: job, error } = await supabase
    .from("jobs")
    .select(`
      id,
      employer_id,
      category_id,
      judul,
      deskripsi,
      kualifikasi,
      lokasi,
      tipe_kerja,
      gaji_min,
      gaji_max,
      deadline,
      status,
      alasan_reject,
      created_at,
      employer:profiles!jobs_employer_id_fkey (
        full_name,
        employer_profile:employer_profiles!employer_profiles_user_id_fkey (
          id,
          user_id,
          nama_perusahaan,
          bidang_usaha,
          deskripsi,
          alamat,
          website,
          is_verified,
          verified_at,
          avg_rating,
          total_reviews,
          created_at,
          updated_at
        )
      ),
      category:categories!jobs_category_id_fkey (
        id,
        nama
      )
    `)
    .eq("id", jobId)
    .eq("status", "approved")
    .maybeSingle()

  if (error || !job) {
    notFound()
  }

  // Get current user to check if already applied
  const { data: { user } } = await supabase.auth.getUser()
  let hasApplied = false

  if (user) {
    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("mahasiswa_id", user.id)
      .maybeSingle()
    hasApplied = !!existing
  }

  // Flatten employer_profile from nested employer object
  const employer = (job as any).employer?.employer_profile ?? null

  // Parse kualifikasi (bisa multi-baris atau kalimat panjang)
  const kualifikasiLines = job.kualifikasi
    ? job.kualifikasi.split(/\n|,/).map((s: string) => s.trim()).filter(Boolean)
    : []

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container max-w-5xl mx-auto px-4 md:px-6">

        <Link href="/jobs" className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Lowongan
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Header Card */}
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-32"></div>
              <CardContent className="px-6 pb-8 pt-0">
                <div className="flex flex-col md:flex-row gap-6 items-start relative -top-12">
                  <div className="w-24 h-24 rounded-2xl bg-white p-2 shadow-lg shrink-0 flex items-center justify-center border border-slate-100">
                    <Building className="h-12 w-12 text-slate-300" />
                  </div>

                  <div className="flex-1 pt-12 md:pt-14 w-full">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{job.judul}</h1>
                        <div className="flex items-center text-lg text-slate-600 font-medium mb-3">
                          {employer?.nama_perusahaan ?? "Perusahaan"}
                          {employer?.is_verified && <VerifiedBadge className="ml-2" />}
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                          {job.lokasi && (
                            <div className="flex items-center">
                              <MapPin className="mr-1.5 h-4 w-4 shrink-0" />
                              {job.lokasi}
                            </div>
                          )}
                          {job.tipe_kerja && (
                            <div className="flex items-center">
                              <Briefcase className="mr-1.5 h-4 w-4 shrink-0" />
                              {getTipeKerjaLabel(job.tipe_kerja as any)}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Calendar className="mr-1.5 h-4 w-4 shrink-0" />
                            Diunggah {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: id })}
                          </div>
                        </div>
                      </div>

                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 self-start text-sm px-3 py-1">
                        Buka
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description & Requirements */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 md:p-8 space-y-8">

                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Deskripsi Pekerjaan</h2>
                  <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap">
                    {job.deskripsi}
                  </div>
                </div>

                {kualifikasiLines.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-4">Persyaratan / Requirements</h2>
                      <ul className="space-y-3">
                        {kualifikasiLines.map((req: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                            <span className="text-slate-600">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {job.deadline && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="h-4 w-4" />
                      <span>Deadline lamaran: <strong className="text-slate-700">{new Date(job.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong></span>
                    </div>
                  </>
                )}

              </CardContent>
            </Card>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Action Card */}
            <Card className="border-0 shadow-sm border-t-4 border-t-blue-600">
              <CardContent className="p-6">
                {(job.gaji_min || job.gaji_max) && (
                  <div className="mb-6">
                    <div className="text-sm font-medium text-slate-500 mb-1">Estimasi Gaji</div>
                    <div className="flex items-center text-2xl font-bold text-slate-900">
                      <DollarSign className="h-6 w-6 text-green-600 mr-1" />
                      {job.gaji_min && job.gaji_max
                        ? `${formatRupiah(job.gaji_min)} – ${formatRupiah(job.gaji_max)}`
                        : job.gaji_min
                        ? `Mulai ${formatRupiah(job.gaji_min)}`
                        : `Hingga ${formatRupiah(job.gaji_max!)}`}
                      <span className="text-sm font-normal text-slate-500 ml-1">/ bulan</span>
                    </div>
                  </div>
                )}

                {!user ? (
                  <Link href="/login">
                    <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">
                      Login untuk Melamar
                    </Button>
                  </Link>
                ) : hasApplied ? (
                  <Button className="w-full h-12 text-lg" disabled>
                    Sudah Melamar
                  </Button>
                ) : (
                  <Link href={`/jobs/${job.id}/apply`}>
                    <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">
                      Lamar Pekerjaan Ini
                    </Button>
                  </Link>
                )}

                <div className="mt-4 flex items-start gap-2 bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>Pastikan profil dan CV Anda sudah lengkap sebelum melamar.</p>
                </div>
              </CardContent>
            </Card>

            {/* Employer Info Card */}
            {employer && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Tentang Perusahaan</h3>

                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mr-3 border border-slate-200">
                      <Building className="h-6 w-6 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center">
                        {employer.nama_perusahaan}
                        {employer.is_verified && <VerifiedBadge className="ml-1.5" />}
                      </div>
                      {employer.bidang_usaha && (
                        <div className="text-sm text-slate-500">{employer.bidang_usaha}</div>
                      )}
                    </div>
                  </div>

                  {employer.deskripsi && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                      {employer.deskripsi}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    {employer.alamat && (
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 text-slate-400 mr-2 shrink-0 mt-0.5" />
                        <span className="text-slate-600">{employer.alamat}</span>
                      </div>
                    )}
                    {employer.avg_rating > 0 && (
                      <div className="flex items-center gap-1 text-amber-500 font-medium">
                        ★ {employer.avg_rating.toFixed(1)}
                        <span className="text-slate-500 font-normal">({employer.total_reviews} ulasan)</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}