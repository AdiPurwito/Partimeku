import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number | null | undefined): string {
  if (amount == null) return "-"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatGajiRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "Gaji tidak ditampilkan"
  if (min != null && max != null) return `${formatRupiah(min)} - ${formatRupiah(max)}`
  if (min != null) return `Mulai ${formatRupiah(min)}`
  return `Hingga ${formatRupiah(max)}`
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-"
  return format(new Date(dateStr), "dd MMM yyyy", { locale: id })
}

export function formatRelativeDate(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: id })
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function getTipeKerjaLabel(tipe: string | null): string {
  switch (tipe) {
    case "remote": return "Remote"
    case "onsite": return "On-site"
    case "hybrid": return "Hybrid"
    default: return "-"
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "approved":
    case "diterima":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    case "pending":
    case "menunggu":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20"
    case "rejected":
    case "ditolak":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    default:
      return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "approved": return "Disetujui"
    case "pending": return "Menunggu"
    case "rejected": return "Ditolak"
    case "menunggu": return "Menunggu"
    case "diterima": return "Diterima"
    case "ditolak": return "Ditolak"
    default: return status
  }
}
