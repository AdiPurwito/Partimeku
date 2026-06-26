"use client"

// src/app/dashboard/employer/upgrade/UpgradeForm.tsx

import { useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { CheckCircle2, Loader2, AlertCircle, Upload, FileImage } from "lucide-react"

const HARGA_PER_BULAN = 20_000

export default function UpgradeForm({
  employerId,
  isPro,
}: {
  employerId: string
  isPro: boolean
}) {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [durasi, setDurasi]   = useState(1)
  const [catatan, setCatatan] = useState("")
  const [buktiFile, setBuktiFile] = useState<File | null>(null)

  const total = HARGA_PER_BULAN * durasi

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (f && f.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB.")
      return
    }
    setError(null)
    setBuktiFile(f)
  }

  function handleSubmit() {
    setError(null)

    if (!buktiFile) {
      setError("Upload screenshot/foto bukti transfer terlebih dahulu.")
      return
    }

    startTransition(async () => {
      // 1. Upload bukti transfer ke storage
      const ext = buktiFile.name.split(".").pop()
      const filePath = `${employerId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, buktiFile)

      if (uploadError) {
        setError("Gagal upload bukti transfer: " + uploadError.message)
        return
      }

      // Bucket ini PRIVAT — jangan pakai getPublicUrl() (gak akan kebuka).
      // Simpan path-nya saja; admin generate signed URL on-demand saat melihat.

      // 2. Insert order pembayaran dengan bukti_url terisi
      const { error: err } = await supabase.from("payments").insert({
        employer_id:  employerId,
        jumlah:       total,
        durasi_bulan: durasi,
        bukti_url:    filePath,
        catatan:      catatan.trim() || null,
        status:       "pending",
      })

      if (err) { setError("Gagal mengirim order: " + err.message); return }
      setSuccess(true)
    })
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <p className="font-semibold text-green-800">Order berhasil dikirim!</p>
        <p className="text-sm text-green-700 mt-1">
          Admin akan konfirmasi pembayaran Rp {total.toLocaleString("id-ID")}{" "}
          dalam 1×24 jam kerja. Plan Pro akan langsung aktif setelah dikonfirmasi.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <h2 className="font-semibold text-slate-800">
        {isPro ? "Perpanjang Langganan Pro" : "Order Upgrade ke Pro"}
      </h2>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label>Durasi Langganan</Label>
        <Select value={String(durasi)} onValueChange={(v) => setDurasi(Number(v))}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 3, 6].map((d) => (
              <SelectItem key={d} value={String(d)}>
                {d} bulan — Rp {(HARGA_PER_BULAN * d).toLocaleString("id-ID")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
        <p className="text-xs text-slate-500">Total transfer</p>
        <p className="text-xl font-bold text-slate-900">Rp {total.toLocaleString("id-ID")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bukti">Bukti Transfer *</Label>
        <label
          htmlFor="bukti"
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
        >
          {buktiFile ? (
            <>
              <FileImage className="w-6 h-6 text-blue-600" />
              <p className="text-sm font-medium text-slate-700 truncate max-w-full">{buktiFile.name}</p>
              <p className="text-xs text-slate-400">Klik untuk ganti file</p>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-slate-400" />
              <p className="text-sm text-slate-600">Upload screenshot/foto bukti transfer</p>
              <p className="text-xs text-slate-400">JPG, PNG, atau PDF — maks 5MB</p>
            </>
          )}
        </label>
        <Input
          id="bukti"
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="catatan">Catatan (opsional)</Label>
        <Textarea
          id="catatan"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Misal: sudah transfer pukul 14.30, atas nama Budi"
          className="h-20 text-sm"
        />
      </div>

      <Button
        className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
        onClick={handleSubmit}
        disabled={isPending}
      >
        {isPending
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
          : "Kirim Konfirmasi Transfer"
        }
      </Button>
      <p className="text-xs text-slate-400 text-center">
        Setelah transfer, klik tombol ini. Admin akan verifikasi dan aktifkan plan Anda.
      </p>
    </div>
  )
}
