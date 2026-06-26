"use client"

import { useState, useEffect, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import ProfilePhotoUpload from "@/components/ProfilePhotoUpload"
import {
  Plus, Pencil, GraduationCap, Briefcase, Wrench, FileText, User,
  Loader2, X, Check, Trash2
} from "lucide-react"
import { toast } from "sonner"

// ── Types ──────────────────────────────────────────────────────────────
interface Profile { id: string; full_name: string | null; avatar_url: string | null; role: string }
interface MahasiswaProfile {
  universitas: string | null; jurusan: string | null
  semester: number | null; no_hp: string | null; bio: string | null
}

// ── Helpers ────────────────────────────────────────────────────────────
function calcStrength(p: Profile | null, m: MahasiswaProfile | null, skills: string[]): number {
  let score = 0
  if (p?.full_name) score += 15
  if (p?.avatar_url) score += 15
  if (m?.bio) score += 15
  if (m?.universitas) score += 15
  if (m?.jurusan) score += 10
  if (m?.semester) score += 5
  if (m?.no_hp) score += 10
  if (skills.length > 0) score += 15
  return Math.min(score, 100)
}

// ── Main Component ─────────────────────────────────────────────────────
export default function ProfilMahasiswa() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mProfile, setMProfile] = useState<MahasiswaProfile | null>(null)
  const [skills, setSkills] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [editDataDiri, setEditDataDiri] = useState(false)
  const [editBio, setEditBio] = useState(false)
  const [editPendidikan, setEditPendidikan] = useState(false)
  const [editSkill, setEditSkill] = useState(false)

  // Form states
  const [formDataDiri, setFormDataDiri] = useState({ full_name: "", no_hp: "" })
  const [formBio, setFormBio] = useState("")
  const [formPendidikan, setFormPendidikan] = useState({ universitas: "", jurusan: "", semester: "" })
  const [formSkillInput, setFormSkillInput] = useState("")
  const [formSkills, setFormSkills] = useState<string[]>([])

  const [isPending, startTransition] = useTransition()

  // ── Load data ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [{ data: p }, { data: m }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("mahasiswa_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      ])

      setProfile(p)
      setMProfile(m)

      // Skills stored as comma-separated string in bio? No — stored in no_hp for now.
      // Actually we store skills separately — check if skills column exists, else use localStorage
      if (m?.skills) setSkills(m.skills)

      setLoading(false)
    }
    load()
  }, [])

  const profileStrength = calcStrength(profile, mProfile, skills)

  // ── Save Data Diri ─────────────────────────────────────────────────
  const openEditDataDiri = () => {
    setFormDataDiri({ full_name: profile?.full_name ?? "", no_hp: mProfile?.no_hp ?? "" })
    setEditDataDiri(true)
  }
  const saveDataDiri = () => {
    startTransition(async () => {
      const { error: e1 } = await supabase
        .from("profiles").update({ full_name: formDataDiri.full_name }).eq("id", userId!)
      const { error: e2 } = await supabase
        .from("mahasiswa_profiles").update({ no_hp: formDataDiri.no_hp }).eq("user_id", userId!)

      if (e1 || e2) {
  console.error("Gagal simpan data diri:", { e1, e2 })
  toast.error(`Gagal menyimpan data diri: ${e1?.message || e2?.message || "unknown error"}`)
  return
}
      setProfile(p => p ? { ...p, full_name: formDataDiri.full_name } : p)
      setMProfile(m => m ? { ...m, no_hp: formDataDiri.no_hp } : m)
      toast.success("Data diri berhasil disimpan")
      setEditDataDiri(false)
    })
  }

  // ── Save Bio ───────────────────────────────────────────────────────
  const openEditBio = () => { setFormBio(mProfile?.bio ?? ""); setEditBio(true) }
  const saveBio = () => {
    startTransition(async () => {
      const { error } = await supabase
        .from("mahasiswa_profiles").update({ bio: formBio }).eq("user_id", userId!)
      if (error) { toast.error("Gagal menyimpan ringkasan"); return }
      setMProfile(m => m ? { ...m, bio: formBio } : m)
      toast.success("Ringkasan diri berhasil disimpan")
      setEditBio(false)
    })
  }

  // ── Save Pendidikan ────────────────────────────────────────────────
  const openEditPendidikan = () => {
    setFormPendidikan({
      universitas: mProfile?.universitas ?? "",
      jurusan: mProfile?.jurusan ?? "",
      semester: mProfile?.semester?.toString() ?? "",
    })
    setEditPendidikan(true)
  }
  const savePendidikan = () => {
    startTransition(async () => {
      const { error } = await supabase.from("mahasiswa_profiles").update({
        universitas: formPendidikan.universitas,
        jurusan: formPendidikan.jurusan,
        semester: parseInt(formPendidikan.semester) || null,
      }).eq("user_id", userId!)
      if (error) { toast.error("Gagal menyimpan pendidikan"); return }
      setMProfile(m => m ? {
        ...m,
        universitas: formPendidikan.universitas,
        jurusan: formPendidikan.jurusan,
        semester: parseInt(formPendidikan.semester) || null,
      } : m)
      toast.success("Pendidikan berhasil disimpan")
      setEditPendidikan(false)
    })
  }

  // ── Save Skills ────────────────────────────────────────────────────
  const openEditSkill = () => { setFormSkills([...skills]); setFormSkillInput(""); setEditSkill(true) }
  const addSkillToForm = () => {
    const s = formSkillInput.trim()
    if (!s || formSkills.includes(s)) return
    setFormSkills(prev => [...prev, s])
    setFormSkillInput("")
  }
  const removeSkillFromForm = (s: string) => setFormSkills(prev => prev.filter(x => x !== s))
 const saveSkills = () => {
  startTransition(async () => {
    const { error } = await supabase
      .from("mahasiswa_profiles")
      .update({ skills: formSkills })
      .eq("user_id", userId!)
    if (error) { toast.error("Gagal menyimpan skill"); return }
    setSkills(formSkills)
    setMProfile(m => m ? { ...m, skills: formSkills } : m)
    toast.success("Skill berhasil disimpan")
    setEditSkill(false)
  })
}

  // ── Render ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
    </div>
  )

  const SectionCard = ({ title, icon: Icon, children, onEdit, onAdd, editLabel = "Edit" }: any) => (
    <Card className="mb-6 shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600 h-8 px-3" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> {editLabel}
            </Button>
          )}
          {onAdd && (
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-3" onClick={onAdd}>
              <Plus className="w-4 h-4 mr-1" /> Tambah
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Profil Saya</h1>
        <p className="text-slate-600 mt-1">Lengkapi profil Anda untuk meningkatkan peluang diterima kerja.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-6 flex flex-col items-center text-center">
              {userId && (
                <ProfilePhotoUpload
                  userId={userId}
                  fullName={profile?.full_name ?? null}
                  currentAvatarUrl={profile?.avatar_url ?? null}
                  onUploadComplete={(url) => setProfile(p => p ? { ...p, avatar_url: url } : p)}
                />
              )}
              <h2 className="mt-4 font-bold text-xl text-slate-900">{profile?.full_name || "Nama belum diisi"}</h2>
              {mProfile?.universitas && (
                <p className="text-sm text-slate-500 mt-1">
                  {mProfile.universitas}{mProfile.semester ? ` • Semester ${mProfile.semester}` : ""}
                </p>
              )}
              {mProfile?.no_hp && <p className="text-xs text-slate-400 mt-1">{mProfile.no_hp}</p>}
              <Button variant="outline" className="w-full mt-6" size="sm" onClick={openEditDataDiri}>
                <Pencil className="w-4 h-4 mr-2" /> Edit Data Diri
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm text-blue-900">Kekuatan Profil</span>
                <span className="font-bold text-sm text-blue-700">{profileStrength}%</span>
              </div>
              <Progress value={profileStrength} className="h-2 mb-4 bg-blue-100 [&>div]:bg-blue-600" />
              <p className="text-xs text-blue-800 leading-relaxed">
                {profileStrength < 50
                  ? "Lengkapi foto profil, bio, dan pendidikan."
                  : profileStrength < 80
                  ? "Tambahkan skill dan nomor HP untuk meningkatkan profil."
                  : "Profil Anda sudah sangat baik!"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2">

          <SectionCard title="Ringkasan Diri" icon={User} onEdit={openEditBio} editLabel={mProfile?.bio ? "Edit" : "Tambah"}>
            {mProfile?.bio ? (
              <p className="text-slate-600 text-sm leading-relaxed">{mProfile.bio}</p>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <p className="text-sm mb-3">Tuliskan ringkasan tentang diri Anda, minat, dan tujuan karir.</p>
                <Button variant="outline" size="sm" onClick={openEditBio}>Tambah Ringkasan</Button>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Pendidikan" icon={GraduationCap} onEdit={openEditPendidikan} editLabel={mProfile?.universitas ? "Edit" : "Tambah"}>
            {mProfile?.universitas ? (
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{mProfile.universitas}</h3>
                  <p className="text-sm text-slate-600">{mProfile.jurusan}</p>
                  {mProfile.semester && <p className="text-xs text-slate-500 mt-1">Semester {mProfile.semester}</p>}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <p className="text-sm mb-3">Tambahkan informasi universitas dan jurusan kamu.</p>
                <Button variant="outline" size="sm" onClick={openEditPendidikan}>Tambah Pendidikan</Button>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Kemampuan (Skill)" icon={Wrench} onAdd={openEditSkill} onEdit={skills.length > 0 ? openEditSkill : undefined} editLabel="Edit">
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map(s => (
                  <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-sm font-medium">{s}</span>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <p className="text-sm mb-3">Tambahkan skill yang kamu kuasai.</p>
                <Button variant="outline" size="sm" onClick={openEditSkill}>Tambah Skill</Button>
              </div>
            )}
          </SectionCard>

        </div>
      </div>

      {/* ── Modal: Edit Data Diri ── */}
      <Dialog open={editDataDiri} onOpenChange={setEditDataDiri}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Data Diri</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nama Lengkap</Label>
              <Input className="mt-1" value={formDataDiri.full_name}
                onChange={e => setFormDataDiri(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <Label>Nomor HP / WhatsApp</Label>
              <Input className="mt-1" placeholder="08xx-xxxx-xxxx" value={formDataDiri.no_hp}
                onChange={e => setFormDataDiri(f => ({ ...f, no_hp: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDataDiri(false)}>Batal</Button>
            <Button onClick={saveDataDiri} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Edit Bio ── */}
      <Dialog open={editBio} onOpenChange={setEditBio}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Ringkasan Diri</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Ceritakan tentang diri kamu, minat, dan tujuan karir</Label>
            <Textarea rows={5} className="mt-1 resize-none" value={formBio}
              onChange={e => setFormBio(e.target.value)}
              placeholder="Contoh: Mahasiswa Informatika semester 4 yang antusias di bidang web development..." />
            <p className="text-xs text-slate-400 text-right">{formBio.length}/500 karakter</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBio(false)}>Batal</Button>
            <Button onClick={saveBio} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Edit Pendidikan ── */}
      <Dialog open={editPendidikan} onOpenChange={setEditPendidikan}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Pendidikan</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nama Universitas</Label>
              <Input className="mt-1" placeholder="Universitas Muhammadiyah Malang"
                value={formPendidikan.universitas}
                onChange={e => setFormPendidikan(f => ({ ...f, universitas: e.target.value }))} />
            </div>
            <div>
              <Label>Jurusan / Program Studi</Label>
              <Input className="mt-1" placeholder="Informatika"
                value={formPendidikan.jurusan}
                onChange={e => setFormPendidikan(f => ({ ...f, jurusan: e.target.value }))} />
            </div>
            <div>
              <Label>Semester Saat Ini</Label>
              <Input className="mt-1" type="number" min={1} max={14} placeholder="4"
                value={formPendidikan.semester}
                onChange={e => setFormPendidikan(f => ({ ...f, semester: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPendidikan(false)}>Batal</Button>
            <Button onClick={savePendidikan} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Edit Skill ── */}
      <Dialog open={editSkill} onOpenChange={setEditSkill}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Kemampuan (Skill)</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input
                placeholder="Contoh: React.js, Figma, Microsoft Excel..."
                value={formSkillInput}
                onChange={e => setFormSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkillToForm() } }}
              />
              <Button type="button" variant="outline" onClick={addSkillToForm}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {formSkills.map(s => (
                <span key={s} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-sm">
                  {s}
                  <button onClick={() => removeSkillFromForm(s)} className="ml-1 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {formSkills.length === 0 && <p className="text-sm text-slate-400">Belum ada skill ditambahkan</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSkill(false)}>Batal</Button>
            <Button onClick={saveSkills}>
              <Check className="w-4 h-4 mr-2" /> Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
