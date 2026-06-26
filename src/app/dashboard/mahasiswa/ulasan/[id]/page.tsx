import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Building, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import UlasanForm from "./UlasanForm"

export default async function BeriUlasanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: applicationId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/dashboard/mahasiswa/ulasan/${applicationId}`)

  // Fetch application with job & employer info, verify ownership
  const { data: application, error } = await supabase
    .from("applications")
    .select(`
      id,
      status,
      mahasiswa_id,
      job:jobs (
        id,
        judul,
        employer_id,
        employer:profiles!jobs_employer_id_fkey (
          id,
          employer_profile:employer_profiles!employer_profiles_user_id_fkey (
            nama_perusahaan,
            bidang_usaha
          )
        )
      ),
      review:reviews!reviews_application_id_fkey (
        id
      )
    `)
    .eq("id", applicationId)
    .maybeSingle()

  if (error || !application) notFound()

  // Guard: only the applicant can review
  if (application.mahasiswa_id !== user.id) redirect("/dashboard/mahasiswa/lamaran")

  // Guard: only accepted applications can be reviewed
  if (application.status !== "diterima") redirect("/dashboard/mahasiswa/lamaran")

  // Guard: already reviewed
  const hasReview = Array.isArray(application.review)
    ? application.review.length > 0
    : !!application.review
  if (hasReview) redirect("/dashboard/mahasiswa/lamaran")

  const job = (application as any).job
  const employer = job?.employer?.employer_profile ?? null
  const employerId = job?.employer_id ?? null

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href="/dashboard/mahasiswa/lamaran"
        className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Lamaran Saya
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Beri Ulasan</h1>
        <p className="text-slate-600 mt-1">Bagikan pengalamanmu bekerja di perusahaan ini.</p>
      </div>

      {/* Info Perusahaan */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Building className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{employer?.nama_perusahaan ?? "Perusahaan"}</p>
              {employer?.bidang_usaha && (
                <p className="text-sm text-slate-500">{employer.bidang_usaha}</p>
              )}
              <p className="text-sm text-slate-500 mt-0.5">Posisi: <span className="font-medium text-slate-700">{job?.judul ?? "-"}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Ulasan */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
            <h2 className="font-semibold text-slate-900">Rating & Ulasan</h2>
          </div>
          <UlasanForm
            applicationId={applicationId}
            employerId={employerId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
