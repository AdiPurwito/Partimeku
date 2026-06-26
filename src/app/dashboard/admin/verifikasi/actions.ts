"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function updateVerificationStatus(
  requestId: string,
  employerId: string,
  status: "approved" | "rejected"
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()
  if (profile?.role !== "admin") return { error: "Unauthorized" }

  const adminSupabase = createAdminClient()

  // Update status verification request
  const { error: reqError } = await adminSupabase
    .from("verification_requests")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", requestId)

  if (reqError) return { error: reqError.message }

  // Jika disetujui: update is_verified DAN account_approved
  if (status === "approved" && employerId) {
    await adminSupabase
      .from("employer_profiles")
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        account_approved: true,
      })
      .eq("user_id", employerId)
  }

  revalidatePath("/dashboard/admin/verifikasi")
  revalidatePath("/dashboard/admin")
  return { success: true }
}