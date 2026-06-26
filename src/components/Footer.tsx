import Link from "next/link"
import { Briefcase, GitBranch, Mail, Globe } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-zinc-950 border-t border-zinc-900 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <span className="bg-gradient-primary rounded-lg p-1.5 text-zinc-50 shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-300">
                <Briefcase size={20} className="stroke-[2.5]" />
              </span>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-200 bg-clip-text text-transparent">
                Partime<span className="text-indigo-400">ku</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              Platform lowongan kerja paruh waktu terpercaya bagi mahasiswa Indonesia. Temukan pekerjaan sampingan yang fleksibel, sesuai dengan jadwal kuliah, dan dapatkan pengalaman kerja berharga sebelum lulus.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider mb-4">Cari Kerja</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/jobs" className="text-sm text-zinc-400 hover:text-indigo-400 transition-colors">
                  Semua Lowongan
                </Link>
              </li>
              <li>
                <Link href="/jobs?type=remote" className="text-sm text-zinc-400 hover:text-indigo-400 transition-colors">
                  Kerja Remote
                </Link>
              </li>
              <li>
                <Link href="/jobs?type=onsite" className="text-sm text-zinc-400 hover:text-indigo-400 transition-colors">
                  Kerja On-site
                </Link>
              </li>
            </ul>
          </div>

          {/* Employer Links */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider mb-4">Untuk Employer</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard/employer/lowongan" className="text-sm text-zinc-400 hover:text-indigo-400 transition-colors">
                  Pasang Lowongan Baru
                </Link>
              </li>
              <li>
                <Link href="/register?role=employer" className="text-sm text-zinc-400 hover:text-indigo-400 transition-colors">
                  Daftar Perusahaan
                </Link>
              </li>
              <li>
                <Link href="/employer/verifikasi" className="text-sm text-zinc-400 hover:text-indigo-400 transition-colors">
                  Panduan Verifikasi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-zinc-900 my-8" />

        {/* Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            &copy; {currentYear} Partimeku. Semua Hak Dilindungi. dibuat untuk Mahasiswa Indonesia.
          </p>
          <div className="flex items-center gap-4 text-zinc-500">
            <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">
              <GitBranch size={18} />
            </Link>
            <Link href="mailto:support@partimeku.com" className="hover:text-zinc-300 transition-colors">
              <Mail size={18} />
            </Link>
            <Link href="/" className="hover:text-zinc-300 transition-colors">
              <Globe size={18} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
