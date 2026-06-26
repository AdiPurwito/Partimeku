"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Category } from "@/lib/types"
import { Search, MapPin, Briefcase, Filter, X, ShieldCheck, RefreshCw } from "lucide-react"

interface JobFiltersProps {
  categories?: Category[]
}

export default function JobFilters({ categories = [] }: JobFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State local matching URL params
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [lokasi, setLokasi] = useState(searchParams.get("lokasi") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "all")
  const [tipeKerja, setTipeKerja] = useState(searchParams.get("tipe_kerja") || "all")
  const [verified, setVerified] = useState(searchParams.get("verified") === "true")
  const [sort, setSort] = useState(searchParams.get("sort") || "baru")

  // Sync state with URL changes (e.g. pagination or clear all)
  useEffect(() => {
    setSearch(searchParams.get("search") || "")
    setLokasi(searchParams.get("lokasi") || "")
    setCategory(searchParams.get("category") || "all")
    setTipeKerja(searchParams.get("tipe_kerja") || "all")
    setVerified(searchParams.get("verified") === "true")
    setSort(searchParams.get("sort") || "baru")
  }, [searchParams])

  const applyFilters = (overrides = {}) => {
    const params = new URLSearchParams()
    
    // Helper to get active value
    const getValue = (key: string, localVal: any) => {
      if (key in overrides) {
        return (overrides as any)[key]
      }
      return localVal
    }

    const currentSearch = getValue("search", search)
    const currentLokasi = getValue("lokasi", lokasi)
    const currentCategory = getValue("category", category)
    const currentTipeKerja = getValue("tipe_kerja", tipeKerja)
    const currentVerified = getValue("verified", verified)
    const currentSort = getValue("sort", sort)

    if (currentSearch) params.set("search", currentSearch)
    if (currentLokasi) params.set("lokasi", currentLokasi)
    if (currentCategory && currentCategory !== "all") params.set("category", currentCategory)
    if (currentTipeKerja && currentTipeKerja !== "all") params.set("tipe_kerja", currentTipeKerja)
    if (currentVerified) params.set("verified", "true")
    if (currentSort && currentSort !== "baru") params.set("sort", currentSort)
    
    // Reset page to 1 when filters change
    params.set("page", "1")

    router.push(`/jobs?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters()
  }

  const handleClearFilters = () => {
    setSearch("")
    setLokasi("")
    setCategory("all")
    setTipeKerja("all")
    setVerified(false)
    setSort("baru")
    router.push("/jobs")
  }

  return (
    <div className="space-y-6">
      {/* Search Header Form */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            type="text"
            placeholder="Cari lowongan atau posisi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus-visible:ring-indigo-500/50 rounded-xl py-5"
          />
        </div>
        <Button 
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-5 transition-colors"
        >
          Cari
        </Button>
      </form>

      {/* Filter Sidebar Card */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-400" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Filter Pencarian</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-zinc-500 hover:text-white h-8 px-2.5 rounded-lg text-xs"
          >
            Reset
          </Button>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <Label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">Kategori</Label>
          <Select 
            value={category} 
            onValueChange={(val) => {
              setCategory(val || "all")
              applyFilters({ category: val || "all" })
            }}
          >
            <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-zinc-300 rounded-xl">
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Filter */}
        <div className="space-y-2">
          <Label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">Lokasi</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              type="text"
              placeholder="Kota atau wilayah..."
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  applyFilters()
                }
              }}
              className="pl-9 bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus-visible:ring-indigo-500/50 rounded-xl"
            />
          </div>
        </div>

        {/* Job Type Filter */}
        <div className="space-y-2">
          <Label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">Tipe Kerja</Label>
          <Select 
            value={tipeKerja} 
            onValueChange={(val) => {
              setTipeKerja(val || "all")
              applyFilters({ tipe_kerja: val || "all" })
            }}
          >
            <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-zinc-300 rounded-xl">
              <SelectValue placeholder="Semua Tipe Kerja" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
              <SelectItem value="all">Semua Tipe Kerja</SelectItem>
              <SelectItem value="remote">Remote (Kerja Jarak Jauh)</SelectItem>
              <SelectItem value="onsite">On-site (Di Lokasi)</SelectItem>
              <SelectItem value="hybrid">Hybrid (Gabungan)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Employer Verified Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <Label htmlFor="verified-employer" className="text-zinc-300 text-xs font-semibold cursor-pointer">
              Employer Verified
            </Label>
          </div>
          <input
            type="checkbox"
            id="verified-employer"
            checked={verified}
            onChange={(e) => {
              const val = e.target.checked
              setVerified(val)
              applyFilters({ verified: val })
            }}
            className="h-4.5 w-4.5 rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-950 accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/60">
          <Label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">Urutkan Berdasarkan</Label>
          <Select 
            value={sort} 
            onValueChange={(val) => {
              setSort(val || "baru")
              applyFilters({ sort: val || "baru" })
            }}
          >
            <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-zinc-300 rounded-xl">
              <SelectValue placeholder="Paling Baru" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
              <SelectItem value="baru">Paling Baru</SelectItem>
              <SelectItem value="gaji">Gaji Tertinggi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
