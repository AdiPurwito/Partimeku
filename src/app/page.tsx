import Link from "next/link"
import {
  Search, Briefcase, Users, Building, ShieldCheck,
  ArrowRight, CheckCircle2, Zap, Star, Clock,
  TrendingUp, Coffee, Laptop, GraduationCap, Palette
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import StatsCard from "@/components/StatsCard"
import JobCard from "@/components/JobCard"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
  const supabase = await createClient()

  // Fetch latest approved jobs from database
  const { data: featuredJobs } = await supabase
    .from("jobs")
    .select(`
      id,
      employer_id,
      category_id,
      judul,
      deskripsi,
      kualifikasi,
      lokasi,
      tipe_kerja,
      gaji_min,
      gaji_max,
      deadline,
      status,
      alasan_reject,
      created_at,
      employer_profile:employer_profiles!employer_profiles_user_id_fkey (
        id,
        user_id,
        nama_perusahaan,
        bidang_usaha,
        deskripsi,
        alamat,
        website,
        is_verified,
        verified_at,
        avg_rating,
        total_reviews,
        created_at,
        updated_at
      )
    `)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(3)

  // Fetch platform stats from database
  const [
    { count: totalJobs },
    { count: totalMahasiswa },
    { count: totalEmployer },
    { count: totalApplications },
  ] = await Promise.all([
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "mahasiswa"),
    supabase.from("employer_profiles").select("*", { count: "exact", head: true }).eq("is_verified", true),
    supabase.from("applications").select("*", { count: "exact", head: true }),
  ])

  const categories = [
    { icon: Coffee, label: "F&B", slug: "F%26B+%26+Hospitality" },
    { icon: Laptop, label: "Digital & IT", slug: "Teknologi+%26+IT" },
    { icon: GraduationCap, label: "Pendidikan", slug: "Pendidikan+%26+Tutor" },
    { icon: Palette, label: "Kreatif", slug: "Desain+%26+Kreatif" },
    { icon: Users, label: "Sales & Marketing", slug: "Marketing+%26+Sales" },
    { icon: Briefcase, label: "Lainnya", slug: "Lainnya" },
  ]

  const steps = [
    {
      number: "01",
      title: "Buat Akun",
      desc: "Daftar gratis dalam 60 detik. Isi profil singkatmu sebagai mahasiswa.",
    },
    {
      number: "02",
      title: "Temukan Lowongan",
      desc: "Cari dan filter ribuan lowongan part-time yang sesuai jadwal kuliahmu.",
    },
    {
      number: "03",
      title: "Lamar & Diterima",
      desc: "Kirim lamaran satu klik dan pantau statusnya langsung di dashboard.",
    },
  ]

  const formatCount = (n: number | null) => {
    if (!n) return "0"
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return String(n)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#080810]">

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-28">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
          <div className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[140px]" />
          <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[100px]" />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">

            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-sm">
              <Zap size={12} className="fill-indigo-400 text-indigo-400" />
              Platform Part-time #1 untuk Mahasiswa Indonesia
            </div>

            {/* Headline */}
            <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-7xl">
              Kerja Sambil Kuliah,{" "}
              <span className="text-gradient-animated">Gak Pake Ribet.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base text-zinc-400 sm:text-lg lg:text-xl leading-relaxed">
              Temukan ribuan lowongan part-time fleksibel yang sesuai jadwal kuliahmu.
              Dari remote hingga on-site — semua ada di Partimeku.
            </p>

            {/* Search bar */}
            <div className="mt-10 w-full max-w-2xl">
              <form
                action="/jobs"
                className="flex flex-col gap-3 sm:flex-row sm:gap-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    type="text"
                    name="q"
                    placeholder="Cari posisi (Barista, Admin, Tutor...)"
                    className="h-13 w-full rounded-xl border border-white/10 bg-white/5 pl-11 text-sm text-white placeholder:text-zinc-500 backdrop-blur-md focus-visible:border-indigo-500/60 focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:ring-offset-0"
                    style={{ height: "52px" }}
                  />
                </div>
                <Button
                  type="submit"
                  className="h-13 shrink-0 rounded-xl bg-indigo-600 px-7 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/30"
                  style={{ height: "52px" }}
                >
                  Cari Lowongan
                </Button>
              </form>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                100% Terverifikasi
              </span>
              <span className="h-3 w-px bg-zinc-700" />
              <span className="flex items-center gap-1.5">
                <Users size={14} className="text-blue-400" />
                {formatCount(totalMahasiswa)}+ Mahasiswa Aktif
              </span>
              <span className="h-3 w-px bg-zinc-700" />
              <span className="flex items-center gap-1.5">
                <Briefcase size={14} className="text-violet-400" />
                {formatCount(totalJobs)}+ Lowongan Aktif
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS SECTION ── */}
      <section className="border-y border-slate-200 bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            <StatsCard title="Total Lowongan" value={formatCount(totalJobs)} icon={Briefcase} />
            <StatsCard title="Mahasiswa Aktif" value={formatCount(totalMahasiswa)} icon={Users} />
            <StatsCard title="Employer Verified" value={formatCount(totalEmployer)} icon={Building} />
            <StatsCard title="Total Lamaran" value={formatCount(totalApplications)} icon={CheckCircle2} />
          </div>
        </div>
      </section>

      {/* ── CATEGORIES SECTION ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col items-center text-center">
            <span className="section-label mb-3">
              <TrendingUp size={12} /> Kategori Populer
            </span>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Temukan Kerja Sesuai Keahlianmu
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map(({ icon: Icon, label, slug }) => (
              <Link
                key={label}
                href={`/jobs?category=${slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-5 text-center transition-all duration-300 hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 group-hover:border-indigo-500/40 group-hover:bg-indigo-500/10">
                  <Icon size={22} className="text-zinc-400 transition-colors group-hover:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-300 transition-colors group-hover:text-white">{label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED JOBS ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="section-label mb-3 inline-flex">
                <Star size={12} /> Pilihan Terbaik
              </span>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Lowongan Part-time Terbaru
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Diperbarui setiap hari — cocok untuk jadwal mahasiswamu.
              </p>
            </div>
            <Link
              href="/jobs"
              className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-white"
            >
              Lihat Semua
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {(featuredJobs ?? []).length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <Briefcase className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
              <p>Belum ada lowongan yang tersedia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {(featuredJobs ?? []).map((job: any) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col items-center text-center">
            <span className="section-label mb-3">
              <Clock size={12} /> Mulai dalam 3 Langkah
            </span>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Cara Kerja Partimeku
            </h2>
          </div>

          <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent md:block" />
            {steps.map((step) => (
              <div
                key={step.number}
                className="relative flex flex-col items-center rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center"
              >
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 shadow-lg shadow-indigo-500/5">
                  <span className="text-2xl font-black text-indigo-400">{step.number}</span>
                </div>
                <h3 className="mb-3 text-lg font-bold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMPLOYER CTA ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/80 via-[#0f0b2a] to-violet-950/60 p-10 text-center shadow-2xl shadow-indigo-950/40 backdrop-blur-xl lg:p-16">
            <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-indigo-600/15 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-violet-600/15 blur-[80px]" />

            <div className="relative z-10">
              <span className="section-label mb-5 inline-flex">
                <Building size={12} /> Untuk Employer & Bisnis
              </span>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
                Butuh Tenaga Bantuan?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-zinc-400 lg:text-lg">
                Rekrut mahasiswa berbakat dengan biaya terjangkau. Pasang lowongan part-time
                pertama Anda <strong className="text-white">secara gratis</strong> dan temukan
                kandidat dalam hitungan jam.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-13 items-center gap-2 rounded-xl bg-white px-8 text-sm font-bold text-indigo-700 shadow-lg shadow-white/10 transition-all hover:bg-indigo-50 hover:shadow-xl"
                  style={{ height: "52px" }}
                >
                  Pasang Lowongan Gratis
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/jobs"
                  className="inline-flex h-13 items-center gap-2 rounded-xl border border-white/15 px-8 text-sm font-semibold text-zinc-300 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/5 hover:text-white"
                  style={{ height: "52px" }}
                >
                  Lihat Demo Platform
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Gratis selamanya untuk 1 lowongan</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Tanpa biaya rekrutmen</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Dashboard mudah digunakan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
