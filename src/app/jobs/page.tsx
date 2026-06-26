import { Suspense } from "react"
import JobCard from "@/components/JobCard"
import JobFilters from "@/components/JobFilters"
import Pagination from "@/components/Pagination"
import { createClient } from "@/lib/supabase/server"
import { Category } from "@/lib/types"

const ITEMS_PER_PAGE = 8

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const supabase = await createClient()

  // Read params — names must match what JobFilters sends
  const search     = typeof resolvedParams.search    === "string" ? resolvedParams.search    : ""
  const category   = typeof resolvedParams.category  === "string" ? resolvedParams.category  : ""
  const tipeKerja  = typeof resolvedParams.tipe_kerja === "string" ? resolvedParams.tipe_kerja : ""
  const lokasi     = typeof resolvedParams.lokasi    === "string" ? resolvedParams.lokasi    : ""
  const sort       = typeof resolvedParams.sort      === "string" ? resolvedParams.sort      : "baru"
  const verifiedOnly = resolvedParams.verified === "true"
  const page = typeof resolvedParams.page === "string" ? Math.max(1, parseInt(resolvedParams.page)) : 1

  // Fetch categories for filter sidebar
  const { data: categories } = await supabase
    .from("categories")
    .select("id, nama")
    .order("nama")

  // Build jobs query
  // IMPORTANT: jobs → employer_profiles has no direct FK.
  // Must go through profiles: jobs → profiles (jobs_employer_id_fkey) → employer_profiles
  let query = supabase
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
      employer:profiles!jobs_employer_id_fkey (
        full_name,
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
      ),
      category:categories!jobs_category_id_fkey (
        id,
        nama
      )
    `, { count: "exact" })
    .eq("status", "approved")

  if (search) {
    query = query.or(`judul.ilike.%${search}%,deskripsi.ilike.%${search}%,lokasi.ilike.%${search}%`)
  }

  if (tipeKerja && tipeKerja !== "all") {
    query = query.eq("tipe_kerja", tipeKerja)
  }

  // Category filter: JobFilters sends UUID directly
  if (category && category !== "all") {
    query = query.eq("category_id", category)
  }

  if (lokasi) {
    query = query.ilike("lokasi", `%${lokasi}%`)
  }

  // Sorting
  if (sort === "gaji") {
    query = query.order("gaji_max", { ascending: false, nullsFirst: false })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const from = (page - 1) * ITEMS_PER_PAGE
  const to   = from + ITEMS_PER_PAGE - 1

  const { data: rawJobs, count } = await query.range(from, to)

  // Flatten employer_profile to top level so JobCard (which reads job.employer_profile) still works
  const jobs = (rawJobs ?? [])
    .map((job: any) => ({
      ...job,
      employer_profile: job.employer?.employer_profile ?? null,
      employer: job.employer ? { full_name: job.employer.full_name } : null,
    }))
    // Client-side filter for verified (applied after fetch; pagination count is approximate when active)
    .filter((job: any) => !verifiedOnly || job.employer_profile?.is_verified === true)

  const totalPages = Math.ceil((count ?? 0) / ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen bg-[#080810] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-10 border-b border-white/5 pb-8">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            Katalog Lowongan Part-time
          </h1>
          <p className="mt-2 text-zinc-500">
            Temukan pekerjaan yang sesuai dengan keahlian dan jadwal kuliahmu.
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-72">
            <div className="sticky top-24">
              <Suspense fallback={<div className="h-[400px] animate-pulse rounded-xl bg-white/5 border border-white/10" />}>
                <JobFilters categories={categories ?? []} />
              </Suspense>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {search && (
              <div className="mb-6 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
                <p className="text-sm text-zinc-400">
                  Hasil pencarian untuk{" "}
                  <span className="font-semibold text-white">&ldquo;{search}&rdquo;</span>
                  {count !== null && (
                    <span className="ml-1 text-zinc-500">— {count} hasil ditemukan</span>
                  )}
                </p>
              </div>
            )}

            {jobs.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                <p className="text-lg font-medium text-zinc-400">Tidak ada lowongan ditemukan.</p>
                <p className="text-sm mt-1">Coba ubah filter atau kata kunci pencarianmu.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {jobs.map((job: any) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-10">
                <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-xl bg-white/5" />}>
                  <Pagination totalPages={totalPages} currentPage={page} />
                </Suspense>
              </div>
            )}
          </main>
        </div>

      </div>
    </div>
  )
}
