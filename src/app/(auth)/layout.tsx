import { ReactNode } from "react"
import Link from "next/link"
import { Briefcase, ShieldCheck, Users, TrendingUp } from "lucide-react"

const features = [
  { icon: ShieldCheck, text: "Semua lowongan terverifikasi" },
  { icon: Users, text: "10,000+ mahasiswa tergabung" },
  { icon: TrendingUp, text: "85% tingkat keberhasilan lamaran" },
]

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#080810]">

      {/* ── LEFT PANEL: Branding ── */}
      <div className="relative hidden lg:flex flex-col overflow-hidden bg-gradient-to-br from-[#0d0b2b] via-[#0f0f1a] to-[#080810]">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-indigo-600/20 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-600/15 blur-[120px]" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[80px]" />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        <div className="relative z-10 flex h-full flex-col p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 w-fit group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-600/30 transition-transform group-hover:scale-105">
              <Briefcase size={18} className="text-white stroke-[2.5]" />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Partime<span className="text-indigo-400">ku</span>
            </span>
          </Link>

          {/* Main copy */}
          <div className="mt-auto mb-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              Platform Part-time #1 Indonesia
            </div>
            <h1 className="text-4xl font-extrabold leading-tight text-white xl:text-5xl">
              Kerja Sampingan{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Lebih Mudah.
              </span>
            </h1>
            <p className="mt-5 max-w-sm text-base text-zinc-400 leading-relaxed">
              Bergabung bersama ribuan mahasiswa yang sudah mendapatkan pengalaman kerja berharga melalui platform kami.
            </p>

            {/* Feature list */}
            <ul className="mt-8 space-y-3">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <Icon size={14} className="text-indigo-400" />
                  </div>
                  <span className="text-sm text-zinc-400">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-sm">
            <div className="flex -space-x-2.5">
              {["B", "A", "R", "D"].map((initial, i) => (
                <div
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#080810] bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white"
                >
                  {initial}
                </div>
              ))}
            </div>
            <p className="text-sm text-zinc-400">
              <strong className="font-semibold text-white">10,000+</strong> mahasiswa sudah bergabung
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Auth Form ── */}
      <div className="flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <Link href="/" className="lg:hidden mb-10 flex items-center justify-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-600/30">
              <Briefcase size={18} className="text-white stroke-[2.5]" />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Partime<span className="text-indigo-400">ku</span>
            </span>
          </Link>

          {children}
        </div>
      </div>
    </div>
  )
}
