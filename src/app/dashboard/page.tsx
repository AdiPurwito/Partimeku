import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function DashboardIndexPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  let { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  // Fallback: try admin client if RLS blocks the read
  if (!profile) {
    const adminSupabase = createAdminClient()
    const { data: adminProfile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
    profile = adminProfile
  }

  // Last resort: create profile from auth metadata
  if (!profile) {
    const adminSupabase = createAdminClient()
    const role = (user.user_metadata?.role as string) || "mahasiswa"
    await adminSupabase.from("profiles").upsert({
      id: user.id,
      role,
      full_name: (user.user_metadata?.full_name as string) || user.email || "",
    }, { onConflict: "id" })
    profile = { role }
  }

  if (profile.role === "employer") redirect("/dashboard/employer")
  else if (profile.role === "admin") redirect("/dashboard/admin")
  else redirect("/dashboard/mahasiswa")
}