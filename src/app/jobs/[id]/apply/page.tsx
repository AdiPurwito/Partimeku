import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Briefcase, MapPin, DollarSign, CheckCircle2, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { formatRupiah, getTipeKerjaLabel } from "@/lib/utils"
import ApplyButton from "./ApplyButton"

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: jobId } = await params
  const supabase = await createClient()

  // Harus login
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/jobs/${jobId}/apply`)

  // Cek role — hanya mahasiswa yang boleh melamar
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "mahasiswa") {
    redirect(`/jobs/${jobId}`)
  }

  // Fetch job detail
  const { data: job, error } = await supabase
    .from("jobs")
    .select(`
      id,
      judul,
      deskripsi,
      lokasi,
      tipe_kerja,
      gaji_min,
      gaji_max,
      deadline,
      status,
      employer:profiles!jobs_employer_id_fkey (
        full_name,
        employer_profile:employer_profiles!employer_profiles_user_id_fkey (
          nama_perusahaan,
          bidang_usaha,
          is_verified
        )
      )
    `)
    .eq("id", jobId)
    .eq("status", "approved")
    .maybeSingle()

  if (error || !job) notFound()

  // Cek apakah sudah pernah melamar
  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("mahasiswa_id", user.id)
    .maybeSingle()

  if (existing) redirect(`/jobs/${jobId}`)

  // Cek kelengkapan profil mahasiswa
  const { data: mProfile } = await supabase
    .from("mahasiswa_profiles")
    .select("universitas, jurusan, no_hp, semester")
    .eq("user_id", user.id)
    .maybeSingle()

  const isProfileComplete = !!(
    profile?.full_name &&
    mProfile?.universitas &&
    mProfile?.jurusan &&
    mProfile?.semester &&
    mProfile?.no_hp
  )

  const employer = (job as any).employer?.employer_profile ?? null

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container max-w-2xl mx-auto px-4 md:px-6">

        <Link
          href={`/jobs/${jobId}`}
          className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Detail Lowongan
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">Konfirmasi Lamaran</h1>

        {/* Info Lowongan */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                <Building className="h-6 w-6 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-slate-900">{job.judul}</h2>
                <p className="text-slate-600 text-sm">{employer?.nama_perusahaan ?? "Perusahaan"}</p>
                {employer?.bidang_usaha && (
                  <p className="text-slate-400 text-xs mt-0.5">{employer.bidang_usaha}</p>
                )}

                <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                  {job.lokasi && (
                    <div className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4" />
                      {job.lokasi}
                    </div>
                  )}
                  {job.tipe_kerja && (
                    <div className="flex items-center">
                      <Briefcase className="mr-1 h-4 w-4" />
                      {getTipeKerjaLabel(job.tipe_kerja as any)}
                    </div>
                  )}
                  {(job.gaji_min || job.gaji_max) && (
                    <div className="flex items-center text-green-600 font-medium">
                      <DollarSign className="mr-1 h-4 w-4" />
                      {job.gaji_min && job.gaji_max
                        ? `${formatRupiah(job.gaji_min)} – ${formatRupiah(job.gaji_max)}`
                        : job.gaji_min
                        ? `Mulai ${formatRupiah(job.gaji_min)}`
                        : `Hingga ${formatRupiah(job.gaji_max!)}`}
                      <span className="text-slate-400 font-normal ml-1">/bln</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Profil */}
        <Card className={`border-0 shadow-sm mb-6 ${isProfileComplete ? "border-l-4 border-l-green-500" : "border-l-4 border-l-amber-400"}`}>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Status Profil Anda</h3>
            <div className="space-y-2 text-sm">
              <ProfileCheck ok={!!profile?.full_name} label="Nama lengkap" value={profile?.full_name} />
              <ProfileCheck ok={!!mProfile?.universitas} label="Universitas" value={mProfile?.universitas} />
              <ProfileCheck ok={!!mProfile?.jurusan} label="Jurusan" value={mProfile?.jurusan} />
              <ProfileCheck ok={!!mProfile?.semester} label="Semester" value={mProfile?.semester ? `Semester ${mProfile.semester}` : undefined} />
              <ProfileCheck ok={!!mProfile?.no_hp} label="Nomor HP" value={mProfile?.no_hp} />
            </div>
            {!isProfileComplete && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                Profil belum lengkap. Kamu tetap bisa melamar, tapi disarankan untuk{" "}
                <Link href="/dashboard/mahasiswa/profil" className="font-semibold underline">
                  melengkapi profil
                </Link>{" "}
                terlebih dahulu.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aksi */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <p className="text-slate-600 text-sm">
              Dengan menekan tombol di bawah, kamu akan mengirimkan lamaran untuk posisi{" "}
              <strong>{job.judul}</strong>. Employer akan meninjau dan menghubungi kamu jika berminat.
            </p>

            <ApplyButton jobId={jobId} />

            <Link href={`/jobs/${jobId}`}>
              <Button variant="ghost" className="w-full text-slate-500">
                Batal
              </Button>
            </Link>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

function ProfileCheck({ ok, label, value }: { ok: boolean; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2
        className={`h-4 w-4 shrink-0 ${ok ? "text-green-500" : "text-slate-300"}`}
      />
      <span className={ok ? "text-slate-700" : "text-slate-400"}>{label}</span>
      {ok && value ? (
        <span className="text-slate-500 font-normal">— {value}</span>
      ) : !ok ? (
        <span className="text-amber-500 text-xs">(belum diisi)</span>
      ) : null}
    </div>
  )
}
