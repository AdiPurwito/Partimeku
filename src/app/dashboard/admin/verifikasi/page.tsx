import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AlertCircle, Eye } from "lucide-react"
import ApproveVerificationButtons from "./ApproveVerificationButtons"

export default async function AdminVerifikasiPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Guard: only admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "admin") redirect("/dashboard")

  const adminSupabase = createAdminClient()

  // Fetch pending verification requests
  const { data: rawRequests, error: reqError } = await adminSupabase
    .from("verification_requests")
    .select(`
      id,
      employer_id,
      dokumen_url,
      catatan_pengaju,
      tipe_request,
      status,
      created_at
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  // Fetch employer info separately for each request (avoid fragile nested join)
  const requests = await Promise.all(
    (rawRequests ?? []).map(async (req) => {
      const { data: profil } = await adminSupabase
        .from("profiles")
        .select("full_name")
        .eq("id", req.employer_id)
        .maybeSingle()

      const { data: empProfile } = await adminSupabase
        .from("employer_profiles")
        .select("nama_perusahaan, bidang_usaha")
        .eq("user_id", req.employer_id)
        .maybeSingle()

      return {
        ...req,
        employer: profil,
        employer_profile: empProfile,
      }
    })
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Verifikasi Employer</h1>
        <p className="text-slate-600 mt-1">Tinjau dan setujui permintaan verifikasi dari employer.</p>
      </div>

      {(requests ?? []).length === 0 ? (
        <div className="p-8 text-center text-slate-500 flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
          <p className="font-medium">Tidak ada permintaan verifikasi yang menunggu.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Nama Perusahaan</th>
                  <th className="px-6 py-4 font-medium">Tipe</th>
                  <th className="px-6 py-4 font-medium">Catatan</th>
                  <th className="px-6 py-4 font-medium">Dokumen</th>
                  <th className="px-6 py-4 font-medium">Tanggal Pengajuan</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req: any) => (
                  <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {req.employer_profile?.nama_perusahaan || req.employer?.full_name || "Employer"}
                      {req.employer_profile?.bidang_usaha && (
                        <p className="text-xs font-normal text-slate-500 mt-0.5">{req.employer_profile.bidang_usaha}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${req.tipe_request === "registrasi" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                        {req.tipe_request === "registrasi" ? "Akun Baru" : "Badge"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs max-w-xs truncate">
                      {req.catatan_pengaju ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      {req.dokumen_url ? (
                        <a
                          href={req.dokumen_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:underline"
                        >
                          <Eye className="w-4 h-4 mr-1.5" /> Lihat
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">Tidak ada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(req.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ApproveVerificationButtons requestId={req.id} employerId={req.employer_id} />
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
