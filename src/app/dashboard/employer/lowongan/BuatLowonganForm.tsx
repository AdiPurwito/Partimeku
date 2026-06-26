"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function BuatLowonganForm() {
  const supabase = createClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    judul: "",
    deskripsi: "",
    kualifikasi: "",
    lokasi: "",
    tipe_kerja: "",
    gaji_min: "",
    gaji_max: "",
    deadline: "",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSelect(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit() {
    setError(null)

    if (!form.judul.trim()) { setError("Judul lowongan wajib diisi."); return }
    if (!form.deskripsi.trim()) { setError("Deskripsi wajib diisi."); return }
    if (!form.tipe_kerja) { setError("Pilih tipe kerja."); return }

    const gaji_min = form.gaji_min ? parseInt(form.gaji_min.replace(/\D/g, "")) : null
    const gaji_max = form.gaji_max ? parseInt(form.gaji_max.replace(/\D/g, "")) : null

    if (gaji_min && gaji_max && gaji_min > gaji_max) {
      setError("Gaji minimum tidak boleh lebih besar dari gaji maksimum.")
      return
    }

    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError("Sesi habis, silakan login ulang."); return }

      const { error: insertError } = await supabase.from("jobs").insert({
        employer_id: user.id,
        judul: form.judul.trim(),
        deskripsi: form.deskripsi.trim(),
        kualifikasi: form.kualifikasi.trim() || null,
        lokasi: form.lokasi.trim() || null,
        tipe_kerja: form.tipe_kerja as "remote" | "onsite" | "hybrid",
        gaji_min,
        gaji_max,
        deadline: form.deadline || null,
        status: "pending",
      })

      if (insertError) {
        console.error("Supabase Insert Error:", insertError)
        setError("Gagal membuat lowongan: " + insertError.message)
        return
      }

      window.location.href = "/dashboard/employer/lowongan"
    })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard/employer/lowongan"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Kelola Lowongan
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Buat Lowongan Baru</h1>
        <p className="text-slate-600 mt-1">Lowongan akan ditinjau admin sebelum ditampilkan ke publik.</p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Detail Lowongan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="judul">Judul Posisi <span className="text-red-500">*</span></Label>
            <Input id="judul" name="judul" value={form.judul} onChange={handleChange} placeholder="Contoh: Barista Part-Time" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi Pekerjaan <span className="text-red-500">*</span></Label>
            <Textarea id="deskripsi" name="deskripsi" className="h-36" value={form.deskripsi} onChange={handleChange} placeholder="Jelaskan tanggung jawab dan detail pekerjaan..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kualifikasi">Kualifikasi</Label>
            <Textarea id="kualifikasi" name="kualifikasi" className="h-28" value={form.kualifikasi} onChange={handleChange} placeholder="Syarat dan kualifikasi yang dibutuhkan..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="lokasi">Lokasi</Label>
              <Input id="lokasi" name="lokasi" value={form.lokasi} onChange={handleChange} placeholder="Contoh: Jakarta Selatan" />
            </div>
            <div className="space-y-2">
              <Label>Tipe Kerja <span className="text-red-500">*</span></Label>
              <Select onValueChange={(v) => handleSelect("tipe_kerja", String(v || ""))}>
                <SelectTrigger><SelectValue placeholder="Pilih tipe kerja" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="onsite">Onsite</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="gaji_min">Gaji Minimum (Rp)</Label>
              <Input id="gaji_min" name="gaji_min" type="number" min={0} value={form.gaji_min} onChange={handleChange} placeholder="Contoh: 500000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gaji_max">Gaji Maksimum (Rp)</Label>
              <Input id="gaji_max" name="gaji_max" type="number" min={0} value={form.gaji_max} onChange={handleChange} placeholder="Contoh: 1500000" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline Lamaran</Label>
            <Input id="deadline" name="deadline" type="date" value={form.deadline} onChange={handleChange} min={new Date().toISOString().split("T")[0]} />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link href="/dashboard/employer/lowongan">
              <Button variant="outline">Batal</Button>
            </Link>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit} disabled={isPending}>
              {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : "Buat Lowongan"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
