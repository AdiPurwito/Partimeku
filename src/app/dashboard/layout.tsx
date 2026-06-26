import { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { LayoutDashboard, User, Briefcase, FileText, LogOut, CheckSquare, Users, Building, CircleDollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/(auth)/actions"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  let { data: userData, error } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle()

  // If profile not found via anon client (RLS might block), try admin client
  if (!userData) {
    const adminSupabase = createAdminClient()
    const { data: adminData } = await adminSupabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle()
    userData = adminData
  }

  // If profile still doesn't exist, create one with default role from auth metadata
  if (!userData) {
    const adminSupabase = createAdminClient()
    const role = (user.user_metadata?.role as string) || "mahasiswa"
    const full_name = (user.user_metadata?.full_name as string) || user.email || ""
    const { error: upsertError } = await adminSupabase.from("profiles").upsert({
      id: user.id,
      role,
      full_name,
    }, { onConflict: "id" })
    
    if (upsertError) {
      console.error("FATAL ERROR: Failed to create fallback profile:", upsertError)
      // We throw error here so it gets caught by Next.js error boundary,
      // instead of silently succeeding and causing "Foreign Key" errors later.
      throw new Error("Gagal membuat profil (Database API Key mungkin salah): " + upsertError.message)
    }
    
    userData = { role, full_name }
  }

  const role = userData.role

  const mahasiswaLinks = [
    { href: "/dashboard/mahasiswa", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/mahasiswa/profil", label: "Profil Saya", icon: User },
    { href: "/dashboard/mahasiswa/lamaran", label: "Lamaran Saya", icon: FileText },
  ]

  const employerLinks = [
    { href: "/dashboard/employer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/employer/profil", label: "Profil Perusahaan", icon: Building },
    { href: "/dashboard/employer/lowongan", label: "Kelola Lowongan", icon: Briefcase },
    { href: "/dashboard/employer/pelamar", label: "Kelola Pelamar", icon: Users },
  ]

  const adminLinks = [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin/verifikasi", label: "Verifikasi Employer", icon: CheckSquare },
    { href: "/dashboard/admin/lowongan", label: "Approval Lowongan", icon: Briefcase },
    { href: "/dashboard/admin/users", label: "Kelola Pengguna", icon: Users },
    { href: "/dashboard/admin/payments", label: "Kelola Pembayaran", icon: CircleDollarSign },
  ]

  const links =
    role === "admin" ? adminLinks :
    role === "employer" ? employerLinks :
    mahasiswaLinks

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Partimeku.
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {role === "employer" ? "Employer" : role === "admin" ? "Admin" : "Mahasiswa"}
            </p>
            <p className="text-sm font-medium text-slate-700 truncate">{userData.full_name ?? user.email}</p>
          </div>

          <nav className="space-y-1 px-3">
            {links.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Icon className="mr-3 flex-shrink-0 h-5 w-5 text-slate-400" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200">
          <form action={logout}>
            <Button variant="ghost" type="submit" className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50">
              <LogOut className="mr-3 h-5 w-5 text-slate-400" />
              Keluar
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-4 md:hidden">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Partimeku.
          </Link>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}