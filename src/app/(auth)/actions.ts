"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  })

  if (error) {
    return { error: error.message }
  }

  if (!authData.user) {
    return { error: "Login gagal, coba lagi." }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", authData.user.id)
    .maybeSingle()

  const role = profile?.role

  if (role === "employer") {
    const { data: existing } = await supabase
      .from("employer_profiles")
      .select("id")
      .eq("user_id", authData.user.id)
      .maybeSingle()

    if (!existing) {
      await supabase.from("employer_profiles").insert({
        user_id: authData.user.id,
        nama_perusahaan: profile?.full_name ?? null,
      })
    }
  }

  if (role === "mahasiswa") {
    const { data: existing } = await supabase
      .from("mahasiswa_profiles")
      .select("id")
      .eq("user_id", authData.user.id)
      .maybeSingle()

    if (!existing) {
      await supabase.from("mahasiswa_profiles").insert({ user_id: authData.user.id })
    }
  }

  revalidatePath("/", "layout")

  if (role === "employer") return { redirectTo: "/dashboard/employer" }
  if (role === "admin") return { redirectTo: "/dashboard/admin" }
  return { redirectTo: "/dashboard/mahasiswa" }
}

export async function register(formData: FormData) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const role = formData.get("role") as string
  const full_name = formData.get("full_name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const nama_perusahaan = formData.get("nama_perusahaan") as string | null

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name,
        ...(nama_perusahaan ? { nama_perusahaan } : {}),
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (!authData.user) {
    return { error: "Registrasi gagal, coba lagi." }
  }

  // Use admin client (bypasses RLS) to ensure profile is created
  const { data: existingProfile } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("id", authData.user.id)
    .maybeSingle()

  if (!existingProfile) {
    await adminSupabase.from("profiles").upsert({
      id: authData.user.id,
      role,
      full_name,
    }, { onConflict: "id" })
  }

  if (role === "mahasiswa") {
    const { data: existing } = await adminSupabase
      .from("mahasiswa_profiles")
      .select("id")
      .eq("user_id", authData.user.id)
      .maybeSingle()

    if (!existing) {
      await adminSupabase.from("mahasiswa_profiles").insert({ user_id: authData.user.id })
    }
  } else if (role === "employer") {
    // 1. Buat employer_profiles
    const { data: existing } = await adminSupabase
      .from("employer_profiles")
      .select("id")
      .eq("user_id", authData.user.id)
      .maybeSingle()

    if (!existing) {
      await adminSupabase.from("employer_profiles").insert({
        user_id: authData.user.id,
        nama_perusahaan: nama_perusahaan || full_name || null,
        account_approved: false, // belum disetujui admin
      })
    }

    // 2. Otomatis buat verification_request tipe "registrasi"
    //    supaya admin tahu ada employer baru yang perlu di-approve
    const { data: existingReq } = await adminSupabase
      .from("verification_requests")
      .select("id")
      .eq("employer_id", authData.user.id)
      .eq("tipe_request", "registrasi")
      .maybeSingle()

    if (!existingReq) {
      await adminSupabase.from("verification_requests").insert({
        employer_id: authData.user.id,
        tipe_request: "registrasi",
        catatan_pengaju: `Pendaftaran akun baru: ${full_name} (${email})`,
        status: "pending",
        // dokumen_url nullable setelah migration 007
      })
    }
  }

  revalidatePath("/", "layout")

  if (role === "employer") return { redirectTo: "/dashboard/employer" }
  return { redirectTo: "/dashboard/mahasiswa" }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}
