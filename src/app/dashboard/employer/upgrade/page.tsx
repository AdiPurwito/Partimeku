// src/app/dashboard/employer/upgrade/page.tsx
// Halaman upgrade ke Pro — konsep sederhana, manual transfer

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import UpgradeForm from "./UpgradeForm"
import { Crown, Check, Zap, Lock } from "lucide-react"

export const metadata = { title: "Upgrade ke Pro – Partimeku" }

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: ep } = await supabase
    .from("employer_profiles")
    .select("plan, plan_expires_at, nama_perusahaan")
    .eq("user_id", user.id)
    .maybeSingle()

  const isPro = ep?.plan === "pro" &&
    (!ep?.plan_expires_at || new Date(ep.plan_expires_at) > new Date())

  const expiresAt = ep?.plan_expires_at

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Crown className="w-6 h-6 text-amber-500" />
          Upgrade ke Pro
        </h1>
        <p className="text-slate-500 mt-1">
          Posting lebih banyak lowongan dan rekrut lebih cepat.
        </p>
      </div>

      {/* Status plan saat ini */}
      {isPro ? (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-4 mb-6 flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <p className="font-semibold text-blue-800">Anda sudah berlangganan Pro 🎉</p>
            {expiresAt && (
              <p className="text-sm text-blue-600 mt-0.5">
                Aktif hingga {new Date(expiresAt).toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            )}
            <p className="text-sm text-blue-600 mt-0.5">
              Perpanjang di bawah jika masa aktif hampir habis.
            </p>
          </div>
        </div>
      ) : (
        /* Perbandingan Free vs Pro */
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Free */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="font-semibold text-slate-600 mb-3">Free (Sekarang)</p>
            <ul className="space-y-2 text-sm text-slate-600">
              {[
                "2 lowongan aktif",
                "Tampil di halaman cari",
                "Kelola pelamar",
              ].map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-slate-400 shrink-0" /> {b}
                </li>
              ))}
              <li className="flex items-center gap-2 text-slate-400">
                <Lock className="w-4 h-4 shrink-0" /> Unlimited lowongan
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Lock className="w-4 h-4 shrink-0" /> Badge Verified
              </li>
            </ul>
          </div>

          {/* Pro */}
          <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-5 relative">
            <span className="absolute -top-3 left-4 bg-blue-600 text-white text-xs font-semibold px-3 py-0.5 rounded-full">
              Rekomendasi
            </span>
            <p className="font-semibold text-blue-800 mb-1">Pro</p>
            <p className="text-2xl font-bold text-slate-900 mb-3">
              Rp 20.000 <span className="text-sm font-normal text-slate-500">/ bulan</span>
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              {[
                "Unlimited lowongan aktif",
                "Tampil di halaman cari",
                "Kelola pelamar",
                "Badge Verified Employer",
                "Prioritas review admin",
              ].map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-500 shrink-0" /> {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Form order */}
      <UpgradeForm employerId={user.id} isPro={isPro} />

      {/* Info transfer */}
      <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-700 mb-1">💳 Cara Bayar</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Transfer ke <strong>BCA 1234567890</strong> a.n. <strong>PT Partimeku Digital</strong></li>
          <li>Isi form di atas dengan jumlah bulan dan catatan nomor transfer Anda</li>
          <li>Admin akan konfirmasi dalam <strong>1×24 jam kerja</strong> dan plan langsung aktif</li>
        </ol>
      </div>
    </div>
  )
}
