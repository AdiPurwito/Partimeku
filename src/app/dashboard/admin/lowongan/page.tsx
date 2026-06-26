import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"
import ApproveJobButtons from "./ApproveJobButtons"

export default async function AdminLowonganPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Guard: only admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "admin") redirect("/dashboard")

  const adminSupabase = createAdminClient()

  // Fetch all pending jobs with employer info
  // Join path: jobs → profiles (via jobs_employer_id_fkey) → employer_profiles (via employer_profiles_user_id_fkey)
  // There is no direct FK between jobs and employer_profiles, so we must go through profiles first.
  const { data: pendingJobs } = await adminSupabase
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
      created_at,
      employer:profiles!jobs_employer_id_fkey (
        full_name,
        employer_profile:employer_profiles!employer_profiles_user_id_fkey (
          nama_perusahaan,
          is_verified
        )
      )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Approval Lowongan</h1>
        <p className="text-slate-600 mt-1">Tinjau lowongan baru yang diposting oleh employer.</p>
      </div>

      {(pendingJobs ?? []).length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="font-medium text-lg">Tidak ada lowongan yang perlu ditinjau.</p>
          <p className="text-sm mt-1">Semua lowongan sudah diproses.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Posisi Pekerjaan</th>
                  <th className="px-6 py-4 font-medium">Perusahaan</th>
                  <th className="px-6 py-4 font-medium">Tanggal Dibuat</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(pendingJobs ?? []).map((job: any) => (
                  <tr key={job.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{job.judul}</p>
                      {job.lokasi && <p className="text-xs text-slate-500 mt-0.5">{job.lokasi}</p>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {(job as any).employer?.employer_profile?.nama_perusahaan ?? (job as any).employer?.full_name ?? "Employer"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(job.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/jobs/${job.id}`}>
                          <Button size="sm" variant="outline" className="h-8">
                            <Eye className="w-4 h-4 mr-1" /> Preview
                          </Button>
                        </Link>
                        <ApproveJobButtons jobId={job.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
