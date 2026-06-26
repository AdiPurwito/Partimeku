// src/app/dashboard/admin/payments/page.tsx
// Halaman kelola pembayaran upgrade Pro — konfirmasi manual

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ConfirmPaymentButton from "./ConfirmPaymentButton"
import { CircleDollarSign, Clock, CheckCircle2, XCircle } from "lucide-react"

export const metadata = { title: "Kelola Pembayaran – Admin Partimeku" }

export default async function AdminPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "admin") redirect("/dashboard")

  const adminSupabase = createAdminClient()

  const { data: payments } = await adminSupabase
    .from("payments")
    .select(`
      id, jumlah, durasi_bulan, status, bukti_url, catatan, created_at, confirmed_at,
      employer:profiles!payments_employer_id_fkey (
        full_name,
        employer_profiles ( nama_perusahaan, plan, plan_expires_at )
      )
    `)
    .order("created_at", { ascending: false })

  // Bucket 'payment-proofs' privat — bukti_url di DB cuma berisi path,
  // bukan URL langsung. Generate signed URL (berlaku 1 jam) di sini
  // pakai service-role client, supaya admin bisa benar-benar buka filenya.
  const allRaw = payments ?? []
  const all = await Promise.all(
    allRaw.map(async (p) => {
      if (!p.bukti_url) return p
      const { data: signed } = await adminSupabase.storage
        .from("payment-proofs")
        .createSignedUrl(p.bukti_url, 60 * 60)
      return { ...p, bukti_signed_url: signed?.signedUrl ?? null }
    })
  )
  const pending = all.filter((p) => p.status === "pending")
  const done    = all.filter((p) => p.status !== "pending")

  // Ringkasan cepat
  const totalLunas = all.filter((p) => p.status === "lunas").reduce((s, p) => s + p.jumlah, 0)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <CircleDollarSign className="w-6 h-6 text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-900">Kelola Pembayaran</h1>
      </div>
      <p className="text-slate-500 text-sm mb-6">
        Total pemasukan lunas:{" "}
        <strong className="text-slate-800">
          Rp {totalLunas.toLocaleString("id-ID")}
        </strong>
        {pending.length > 0 && (
          <span className="ml-3 text-amber-600 font-medium">
            · {pending.length} menunggu konfirmasi
          </span>
        )}
      </p>

      {/* Pending */}
      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Menunggu Konfirmasi ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((p) => <PaymentRow key={p.id} payment={p} showAction />)}
          </div>
        </section>
      )}

      {/* Riwayat */}
      {done.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Riwayat
          </h2>
          <div className="space-y-3">
            {done.map((p) => <PaymentRow key={p.id} payment={p} />)}
          </div>
        </section>
      )}

      {all.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <CircleDollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Belum ada pembayaran masuk.</p>
        </div>
      )}
    </div>
  )
}

function PaymentRow({ payment: p, showAction }: { payment: any; showAction?: boolean }) {
  const emp  = p.employer as any
  const ep   = emp?.employer_profiles?.[0]

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-900">{emp?.full_name ?? "–"}</span>
          <span className="text-xs text-slate-400">({ep?.nama_perusahaan ?? "–"})</span>
          <StatusBadge status={p.status} />
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-slate-600">
          <span>Paket: <strong className="text-blue-700">Pro</strong></span>
          <span>{p.durasi_bulan} bulan</span>
          <span className="font-semibold text-slate-800">Rp {p.jumlah.toLocaleString("id-ID")}</span>
        </div>
        {p.catatan && <p className="text-xs text-slate-400 mt-1">"{p.catatan}"</p>}
        <p className="text-xs text-slate-400 mt-1">
          {new Date(p.created_at).toLocaleString("id-ID", {
            day: "numeric", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
          {p.confirmed_at && (
            <> · Dikonfirmasi: {new Date(p.confirmed_at).toLocaleString("id-ID", {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            })}</>
          )}
          {ep?.plan_expires_at && p.status === "lunas" && (
            <> · Aktif s.d. {new Date(ep.plan_expires_at).toLocaleDateString("id-ID", {
              day: "numeric", month: "short", year: "numeric",
            })}</>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {p.bukti_signed_url && (
          <a
            href={p.bukti_signed_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Lihat Bukti ↗
          </a>
        )}
        {showAction && <ConfirmPaymentButton paymentId={p.id} />}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    pending: { label: "Menunggu", icon: <Clock className="w-3 h-3" />,         cls: "bg-amber-100 text-amber-700" },
    lunas:   { label: "Lunas",    icon: <CheckCircle2 className="w-3 h-3" />,  cls: "bg-green-100 text-green-700" },
    batal:   { label: "Batal",    icon: <XCircle className="w-3 h-3" />,       cls: "bg-red-100 text-red-700" },
  }
  const s = map[status] ?? map.pending
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  )
}
