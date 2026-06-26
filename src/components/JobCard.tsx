import Link from "next/link"
import { Briefcase, MapPin, DollarSign, Calendar, Star, Wifi, Monitor, GitMerge } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import VerifiedBadge from "@/components/VerifiedBadge"
import { Job } from "@/lib/types"
import { getTipeKerjaLabel, formatGajiRange, formatDate } from "@/lib/utils"

interface JobCardProps {
  job: Job
  className?: string
}

function TipeKerjaIcon({ tipe }: { tipe: string | null }) {
  switch (tipe) {
    case "remote": return <Wifi size={10} className="mr-1 text-emerald-400" />
    case "onsite": return <Monitor size={10} className="mr-1 text-blue-400" />
    case "hybrid": return <GitMerge size={10} className="mr-1 text-violet-400" />
    default: return <Briefcase size={10} className="mr-1 text-zinc-400" />
  }
}

function TipeKerjaBadgeColor(tipe: string | null) {
  switch (tipe) {
    case "remote": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    case "onsite": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    case "hybrid": return "bg-violet-500/10 text-violet-400 border-violet-500/20"
    default: return "bg-zinc-800/60 text-zinc-300 border-zinc-700/50"
  }
}

export default function JobCard({ job, className = "" }: JobCardProps) {
  const companyName = job.employer_profile?.nama_perusahaan || job.employer?.full_name || "Perusahaan Rahasia"
  const isVerified = job.employer_profile?.is_verified || false
  const avgRating = job.employer_profile?.avg_rating || 0
  const totalReviews = job.employer_profile?.total_reviews || 0
  const salaryRange = formatGajiRange(job.gaji_min, job.gaji_max)
  const formattedDeadline = job.deadline ? formatDate(job.deadline) : null

  // Get company initial for avatar
  const companyInitial = companyName.charAt(0).toUpperCase()

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <Card
        className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f1a] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-950/30 ${className}`}
      >
        {/* Hover glow overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: "radial-gradient(circle at top left, rgba(99,102,241,0.04) 0%, transparent 60%)" }} />

        <CardContent className="relative z-10 flex flex-col gap-4 p-5 md:p-6">

          {/* ── Header: Company + Rating ── */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Company avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-base font-bold text-zinc-400">
                {companyInitial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-medium text-zinc-500">
                    {companyName}
                  </span>
                  {isVerified && <VerifiedBadge size={13} />}
                </div>
                <h3 className="mt-0.5 truncate text-base font-bold text-zinc-100 transition-colors group-hover:text-indigo-300">
                  {job.judul}
                </h3>
              </div>
            </div>

            {/* Rating */}
            {totalReviews > 0 ? (
              <div className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-400">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                {avgRating.toFixed(1)}
              </div>
            ) : (
              <div className="shrink-0 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-2 py-1 text-[10px] text-zinc-600">
                Baru
              </div>
            )}
          </div>

          {/* ── Badges: Tipe & Lokasi ── */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${TipeKerjaBadgeColor(job.tipe_kerja)}`}>
              <TipeKerjaIcon tipe={job.tipe_kerja} />
              {getTipeKerjaLabel(job.tipe_kerja)}
            </span>

            {job.lokasi && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-800/60 bg-zinc-800/30 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                <MapPin size={10} className="text-zinc-500" />
                {job.lokasi}
              </span>
            )}
          </div>

          {/* ── Footer: Salary + Deadline ── */}
          <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <DollarSign size={13} />
              <span>{salaryRange}</span>
            </div>
            {formattedDeadline && (
              <div className="flex items-center gap-1 text-zinc-500">
                <Calendar size={11} />
                <span>Hingga <span className="font-semibold text-zinc-400">{formattedDeadline}</span></span>
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </Link>
  )
}
