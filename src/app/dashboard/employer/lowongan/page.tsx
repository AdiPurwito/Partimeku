import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldAlert, Clock, Plus, Pencil, MapPin, Briefcase, CalendarDays } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import DeleteJobButton from "./DeleteJobButton"
import CloseJobButton from "./CloseJobButton"

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    approved: { label: "Aktif", className: "bg-green-100 text-green-700 border border-green-200" },
    pending:  { label: "Menunggu", className: "bg-amber-100 text-amber-700 border border-amber-200" },
    rejected: { label: "Ditolak", className: "bg-red-100 text-red-700 border border-red-200" },
    closed:   { label: "Ditutup", className: "bg-slate-100 text-slate-600 border border-slate-200" },
  }
  const s = map[status] ?? { label: status, className: "bg-slate-100 text-slate-600" }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  )
}

export default async function KelolaLowonganPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Cek status account_approved employer
  const { data: ep } = await supabase
    .from("employer_profiles")
    .select("account_approved")
    .eq("user_id", user.id)
    .maybeSingle()

  const isApproved = ep?.account_approved === true

  // Cek apakah sudah ada verification request registrasi
  const { data: verifReq } = await supabase
    .from("verification_requests")
    .select("status, created_at")
    .eq("employer_id", user.id)
    .eq("tipe_request", "registrasi")
    .maybeSingle()

  // Kalau belum disetujui → tampilkan halaman blokir
  if (!isApproved) {
    const isPending = verifReq?.status === "pending"
    const isRejected = verifReq?.status === "rejected"

    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className={`h-1.5 w-full ${isRejected ? "bg-red-500" : "bg-amber-400"}`} />
          <div className="p-10 flex flex-col items-center text-center gap-5">
            {isRejected ? (
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {isRejected ? "Akun Anda Tidak Disetujui" : "Akun Sedang Menunggu Verifikasi Admin"}
              </h1>
              <p className="text-slate-500 mt-2 text-sm max-w-md leading-relaxed">
                {isRejected
                  ? "Pengajuan akun employer Anda ditolak oleh admin. Silakan hubungi tim Partimeku untuk informasi lebih lanjut."
                  : "Akun employer Anda sedang ditinjau oleh tim admin kami. Proses verifikasi biasanya memakan waktu 1×24 jam kerja."}
              </p>
            </div>
            <div className={`w-full max-w-sm rounded-xl px-5 py-4 text-sm ${
              isRejected
                ? "bg-red-50 border border-red-100 text-red-700"
                : "bg-amber-50 border border-amber-100 text-amber-700"
            }`}>
              {isRejected ? (
                <p>Status: <strong>Ditolak</strong></p>
              ) : (
                <div className="space-y-1">
                  <p>Status: <strong>Menunggu Persetujuan</strong></p>
                  {verifReq?.created_at && (
                    <p className="text-xs opacity-75">
                      Didaftarkan:{" "}
                      {new Date(verifReq.created_at).toLocaleDateString("id-ID", {
                        day: "numeric", month: "long", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Setelah akun disetujui, Anda dapat langsung membuat dan memposting lowongan.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Fetch semua lowongan milik employer ini
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, judul, status, lokasi, tipe_kerja, gaji_min, gaji_max, deadline, created_at")
    .eq("employer_id", user.id)
    .order("created_at", { ascending: false })

  const allJobs = jobs ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kelola Lowongan</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {allJobs.length} lowongan terdaftar
          </p>
        </div>
        <Link href="/dashboard/employer/lowongan/buat">
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="w-4 h-4" /> Buat Lowongan
          </Button>
        </Link>
      </div>

      {/* Empty state */}
      {allJobs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 flex flex-col items-center gap-3 text-center">
          <Briefcase className="w-10 h-10 text-slate-300" />
          <p className="font-medium text-slate-500">Belum ada lowongan</p>
          <p className="text-sm text-slate-400">Buat lowongan pertama Anda untuk mulai menerima pelamar.</p>
          <Link href="/dashboard/employer/lowongan/buat" className="mt-2">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-4 h-4" /> Buat Lowongan
            </Button>
          </Link>
        </div>
      )}

      {/* Job list */}
      {allJobs.length > 0 && (
        <div className="space-y-3">
          {allJobs.map((job) => {
            const canEdit = job.status !== "closed"
            const canClose = job.status === "approved"

            return (
              <div
                key={job.id}
                className="rounded-xl border border-slate-200 bg-white shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Info kiri */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 truncate">{job.judul}</span>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                    {job.lokasi && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {job.lokasi}
                      </span>
                    )}
                    {job.tipe_kerja && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        {job.tipe_kerja.charAt(0).toUpperCase() + job.tipe_kerja.slice(1)}
                      </span>
                    )}
                    {job.deadline && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Deadline: {new Date(job.deadline).toLocaleDateString("id-ID", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    )}
                    {(job.gaji_min || job.gaji_max) && (
                      <span>
                        Rp {job.gaji_min?.toLocaleString("id-ID") ?? "?"} – {job.gaji_max?.toLocaleString("id-ID") ?? "?"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Dibuat {new Date(job.created_at).toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>

                {/* Aksi kanan */}
                <div className="flex items-center gap-2 shrink-0">
                  {canEdit && (
                    <Link href={`/dashboard/employer/lowongan/${job.id}/edit`}>
                      <Button size="sm" variant="outline" className="h-8 gap-1.5">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
                    </Link>
                  )}
                  {canClose && (
                    <CloseJobButton jobId={job.id} />
                  )}
                  <DeleteJobButton jobId={job.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
