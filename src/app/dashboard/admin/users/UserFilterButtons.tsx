"use client"

import { useRouter } from "next/navigation"

type Counts = {
  semua: number
  mahasiswa: number
  employer: number
  admin: number
  aktif: number
  nonaktif: number
}

// PERBAIKAN: Semua activeClass menggunakan bg-white, dengan border dan text yang berbeda-beda
const filters: { label: string; value: keyof Counts; activeClass: string }[] = [
  { label: "Semua", value: "semua", activeClass: "bg-white text-slate-900 border-slate-900" },
  { label: "Mahasiswa", value: "mahasiswa", activeClass: "bg-white text-blue-600 border-blue-600" },
  { label: "Employer", value: "employer", activeClass: "bg-white text-purple-600 border-purple-600" },
  { label: "Aktif", value: "aktif", activeClass: "bg-white text-green-600 border-green-600" },
  { label: "Nonaktif", value: "nonaktif", activeClass: "bg-white text-slate-400 border-slate-300" },
]

export default function UserFilterButtons({ active, counts }: { active: string; counts: Counts }) {
  const router = useRouter()

  const handleFilter = (value: string) => {
    const params = new URLSearchParams()
    if (value !== "semua") params.set("filter", value)
    router.push(`/dashboard/admin/users${params.toString() ? `?${params}` : ""}`)
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filters.map((f) => {
        const isActive = active === f.value
        return (
          <button
            key={f.value}
            onClick={() => handleFilter(f.value)}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              isActive
                ? f.activeClass
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900"
            }`}
          >
            {f.label}
            {/* Bagian Badge Angka: Warnanya otomatis mengikuti warna teks tombol induknya saat aktif */}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold transition-colors ${
              isActive 
                ? "bg-slate-100 current-color" 
                : "bg-slate-100 text-slate-500"
            }`}>
              {counts[f.value]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
