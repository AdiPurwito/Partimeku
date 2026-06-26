import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AlertCircle, AlertTriangle } from "lucide-react"
import ReviewModerationButtons from "./ReviewModerationButtons"

export default async function AdminReviewPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "admin") redirect("/dashboard")

  const adminSupabase = createAdminClient()

  // Fetch flagged reviews with mahasiswa and employer info
  const { data: flaggedReviews } = await adminSupabase
    .from("reviews")
    .select(`
      id,
      rating,
      komentar,
      is_reported,
      created_at,
      mahasiswa:profiles!reviews_mahasiswa_id_fkey (
        full_name
      ),
      employer:profiles!reviews_employer_id_fkey (
        full_name,
        employer_profile:employer_profiles!employer_profiles_user_id_fkey (
          nama_perusahaan
        )
      )
    `)
    .eq("is_reported", true)
    .order("created_at", { ascending: false })

  const reviews = flaggedReviews ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Moderasi Ulasan</h1>
        <p className="text-slate-600 mt-1">Tinjau ulasan yang dilaporkan untuk memastikan lingkungan yang aman.</p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-slate-700">Tidak ada ulasan yang perlu dimoderasi.</p>
          <p className="text-sm text-slate-500 mt-1">Semua ulasan dalam kondisi baik.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => {
            const employerName =
              review.employer?.employer_profile?.nama_perusahaan ??
              review.employer?.full_name ??
              "Perusahaan"
            const reviewerName = review.mahasiswa?.full_name ?? "Mahasiswa"
            const date = new Date(review.created_at).toLocaleDateString("id-ID", {
              day: "numeric", month: "long", year: "numeric",
            })

            return (
              <div key={review.id} className="bg-white rounded-xl border border-red-200 p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      Ulasan untuk: {employerName}
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Dilaporkan
                      </span>
                    </h3>
                    <p className="text-sm text-slate-500">
                      Oleh: {reviewerName} • {date} •{" "}
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </p>
                  </div>
                </div>

                {review.komentar ? (
                  <div className="bg-slate-50 p-4 rounded-lg text-slate-700 italic border border-slate-100 mb-6">
                    "{review.komentar}"
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-lg text-slate-400 italic border border-slate-100 mb-6">
                    (Tidak ada komentar)
                  </div>
                )}

                <ReviewModerationButtons reviewId={review.id} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
