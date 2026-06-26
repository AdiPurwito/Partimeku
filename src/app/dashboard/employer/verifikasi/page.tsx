"use client"

import { useEffect, useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BadgeCheck, Upload, AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react"

type VerifStatus = "none" | "pending" | "approved" | "rejected"

export default function VerifikasiBadgePage() {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [verifStatus, setVerifStatus] = useState<VerifStatus>("none")
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    nomor_dokumen: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStatus() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Check if employer already has a verification request
      const { data: existing } = await supabase
        .from("verification_requests")
        .select("status")
        .eq("employer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing) {
        setVerifStatus(existing.status as VerifStatus)
      } else {
        // Check if already verified via employer_profiles
        const { data: ep } = await supabase
          .from("employer_profiles")
          .select("is_verified")
          .eq("user_id", user.id)
          .maybeSingle()
        if (ep?.is_verified) setVerifStatus("approved")
      }

      setLoading(false)
    }
    loadStatus()
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (f && f.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB.")
      return
    }
    setError(null)
    setFile(f)
  }

  function handleSubmit() {
    if (!userId) return
    if (!file) { setError("Pilih file dokumen terlebih dahulu."); return }
    if (!form.nomor_dokumen.trim()) { setError("Masukkan nomor dokumen terlebih dahulu."); return }
    setError(null)

    startTransition(async () => {
      // Upload dokumen ke storage
      const ext = file.name.split(".").pop()
      const filePath = `${userId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("verification-docs")
        .upload(filePath, file)

      if (uploadError) {
        setError("Gagal upload dokumen: " + uploadError.message)
        return
      }

      const { data: urlData } = supabase.storage
        .from("verification-docs")
        .getPublicUrl(filePath)

      // Insert verification request
      const { error: insertError } = await supabase
        .from("verification_requests")
        .insert({
          employer_id: userId,
          dokumen_url: urlData.publicUrl,
          catatan_pengaju: form.nomor_dokumen,
        })

      if (insertError) {
        setError("Gagal mengirim pengajuan: " + insertError.message)
        return
      }

      setVerifStatus("pending")
      setSubmitted(true)
    })
  }

  const statusInfo: Record<VerifStatus, { label: string; color: string; icon: React.ReactNode }> = {
    none: { label: "Belum Terverifikasi", color: "text-slate-600", icon: <AlertCircle className="w-5 h-5" /> },
    pending: { label: "Menunggu Review Admin", color: "text-yellow-600", icon: <Clock className="w-5 h-5" /> },
    approved: { label: "Terverifikasi ✓", color: "text-green-600", icon: <CheckCircle2 className="w-5 h-5" /> },
    rejected: { label: "Pengajuan Ditolak", color: "text-red-600", icon: <XCircle className="w-5 h-5" /> },
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-40">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const info = statusInfo[verifStatus]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Verifikasi Badge</h1>
        <p className="text-slate-600 mt-1">Dapatkan badge verifikasi agar lowongan Anda lebih dipercaya.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Ajukan Verifikasi</CardTitle>
              <CardDescription>Upload dokumen legalitas usaha untuk mendapatkan badge verifikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Status banner */}
              <div className={`p-4 rounded-lg flex gap-3 text-sm items-start ${
                verifStatus === "approved" ? "bg-green-50 text-green-700" :
                verifStatus === "pending" ? "bg-yellow-50 text-yellow-700" :
                verifStatus === "rejected" ? "bg-red-50 text-red-700" :
                "bg-blue-50 text-blue-700"
              }`}>
                <span className="shrink-0 mt-0.5">{info.icon}</span>
                <p>Status Anda saat ini: <strong>{info.label}</strong>.
                  {verifStatus === "none" && " Tim admin kami akan meninjau dokumen Anda dalam 1-2 hari kerja."}
                  {verifStatus === "pending" && " Harap tunggu, admin sedang meninjau pengajuan Anda."}
                  {verifStatus === "approved" && " Selamat! Akun Anda sudah terverifikasi."}
                  {verifStatus === "rejected" && " Pengajuan Anda ditolak. Anda bisa mengajukan ulang dengan dokumen yang benar."}
                </p>
              </div>

              {/* Form — only show when none or rejected */}
              {(verifStatus === "none" || verifStatus === "rejected") && !submitted && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nomor Induk Berusaha (NIB) / SIUP</Label>
                    <Input
                      type="text"
                      placeholder="Masukkan nomor dokumen"
                      value={form.nomor_dokumen}
                      onChange={(e) => setForm({ nomor_dokumen: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Scan Dokumen Legalitas</Label>
                    <label className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      {file ? (
                        <p className="text-sm font-medium text-blue-600">{file.name}</p>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-slate-700">Pilih file dokumen legalitas</p>
                          <p className="text-xs text-slate-500 mt-1">Format PDF, maksimal 5MB</p>
                        </>
                      )}
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> {error}
                    </p>
                  )}
                </div>
              )}

              {submitted && (
                <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                  <CheckCircle2 className="w-5 h-5" /> Pengajuan berhasil dikirim! Admin akan meninjau dalam 1-2 hari kerja.
                </div>
              )}
            </CardContent>

            {(verifStatus === "none" || verifStatus === "rejected") && !submitted && (
              <CardFooter>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  onClick={handleSubmit}
                  disabled={isPending}
                >
                  {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...</> : "Kirim Pengajuan"}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="border border-slate-200 shadow-sm bg-gradient-to-b from-slate-50 to-white">
            <CardContent className="p-6 text-center">
              <BadgeCheck className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-lg text-slate-900 mb-2">Keuntungan Verifikasi</h3>
              <ul className="text-sm text-slate-600 text-left space-y-3 mt-4">
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 mr-2 shrink-0"></div>
                  Mendapatkan badge "Verified Employer" di profil dan lowongan Anda.
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 mr-2 shrink-0"></div>
                  Meningkatkan kepercayaan pelamar hingga 300%.
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 mr-2 shrink-0"></div>
                  Prioritas tampilan di halaman pencarian lowongan.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
