"use client"

import { useEffect, useState, useTransition, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Building, Loader2, CheckCircle2, Camera, Upload } from "lucide-react"
import { toast } from "sonner"

export default function ProfilEmployerPage() {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [fullName, setFullName] = useState<string | null>(null)

  // Logo upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [form, setForm] = useState({
    nama_perusahaan: "",
    bidang_usaha: "",
    deskripsi: "",
    alamat: "",
    website: "",
  })

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [{ data: profile }, { data: employer }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase
          .from("employer_profiles")
          .select("nama_perusahaan, bidang_usaha, deskripsi, alamat, website, logo_url")
          .eq("user_id", user.id)
          .maybeSingle(),
      ])

      if (profile) setFullName(profile.full_name)

      if (employer) {
        setForm({
          nama_perusahaan: employer.nama_perusahaan ?? "",
          bidang_usaha: employer.bidang_usaha ?? "",
          deskripsi: employer.deskripsi ?? "",
          alamat: employer.alamat ?? "",
          website: employer.website ?? "",
        })
        if (employer.logo_url) setLogoPreview(employer.logo_url)
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // ── Logo Upload ─────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    if (!file.type.startsWith("image/")) {
      toast.error("Format file harus berupa gambar (JPEG, PNG, WebP)")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB")
      return
    }

    setUploading(true)
    setUploadProgress(10)

    try {
      // Local preview
      setLogoPreview(URL.createObjectURL(file))
      setUploadProgress(30)

      const ext = file.name.split(".").pop()
      const filePath = `${userId}/logo.${ext}`

      setUploadProgress(50)

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      setUploadProgress(80)

      const { data: { publicUrl } } = supabase.storage
        .from("company-logos")
        .getPublicUrl(filePath)

      const finalUrl = `${publicUrl}?t=${Date.now()}`

      const { error: dbError } = await supabase
        .from("employer_profiles")
        .update({ logo_url: finalUrl })
        .eq("user_id", userId)

      if (dbError) throw dbError

      setLogoPreview(finalUrl)
      setUploadProgress(100)
      toast.success("Logo perusahaan berhasil diperbarui")
    } catch (err: any) {
      console.error("Upload error:", err)
      toast.error(err.message || "Gagal mengunggah logo")
    } finally {
      setUploading(false)
      setUploadProgress(0)
      // Reset input agar file yang sama bisa dipilih ulang
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // ── Save Form ───────────────────────────────────────────────────────
  function handleSave() {
    if (!userId) return
    setSaved(false)
    startTransition(async () => {
      const { error } = await supabase
        .from("employer_profiles")
        .update({
          nama_perusahaan: form.nama_perusahaan || null,
          bidang_usaha: form.bidang_usaha || null,
          deskripsi: form.deskripsi || null,
          alamat: form.alamat || null,
          website: form.website || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (error) {
        toast.error("Gagal menyimpan profil: " + error.message)
        return
      }
      setSaved(true)
      toast.success("Profil perusahaan berhasil disimpan")
      setTimeout(() => setSaved(false), 3000)
    })
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-40">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Profil Perusahaan</h1>
        <p className="text-slate-600 mt-1">Informasi ini akan ditampilkan pada lowongan yang Anda buat.</p>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Informasi Perusahaan</CardTitle>
          <CardDescription>Lengkapi identitas perusahaan Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* ── Logo Upload ── */}
          <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 w-full max-w-xs">
            <div className="relative group">
              {/* Logo preview / placeholder */}
              <div className="w-24 h-24 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-indigo-400 transition-colors">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="Logo perusahaan"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building className="w-10 h-10 text-slate-400" />
                )}
              </div>

              {/* Hover overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="text-white" size={22} />
              </button>

              {/* Spinner */}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 z-10">
                  <Loader2 className="animate-spin text-indigo-500" size={22} />
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Logo Perusahaan</p>
              <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, WebP (Maks. 2MB)</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              <Upload size={14} className="mr-2" />
              {uploading ? "Mengunggah..." : "Pilih Logo"}
            </Button>

            {uploading && (
              <div className="w-full">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Mengunggah...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1" />
              </div>
            )}
          </div>

          {/* ── Form Fields ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nama_perusahaan">Nama Perusahaan / Bisnis</Label>
              <Input
                id="nama_perusahaan"
                name="nama_perusahaan"
                value={form.nama_perusahaan}
                onChange={handleChange}
                placeholder="Contoh: PT Maju Bersama"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bidang_usaha">Industri / Bidang Usaha</Label>
              <Input
                id="bidang_usaha"
                name="bidang_usaha"
                value={form.bidang_usaha}
                onChange={handleChange}
                placeholder="Contoh: Food & Beverage"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi Singkat</Label>
            <Textarea
              id="deskripsi"
              name="deskripsi"
              className="h-32"
              value={form.deskripsi}
              onChange={handleChange}
              placeholder="Ceritakan tentang perusahaan Anda..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat Lengkap</Label>
            <Textarea
              id="alamat"
              name="alamat"
              value={form.alamat}
              onChange={handleChange}
              placeholder="Jl. Contoh No. 1, Kota..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website (opsional)</Label>
            <Input
              id="website"
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="https://perusahaan.com"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> Tersimpan
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : "Simpan Perubahan"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
