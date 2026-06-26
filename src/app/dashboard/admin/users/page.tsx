import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import ToggleUserStatus from "./ToggleUserStatus"
import UserFilterButtons from "./UserFilterButtons"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "admin") redirect("/dashboard")

  const { filter } = await searchParams
  const activeFilter = filter ?? "semua"

  const adminSupabase = createAdminClient()

  let query = adminSupabase
    .from("profiles")
    .select("id, full_name, role, is_active, created_at")
    .order("created_at", { ascending: false })

  if (activeFilter === "mahasiswa" || activeFilter === "employer" || activeFilter === "admin") {
    query = query.eq("role", activeFilter)
  } else if (activeFilter === "aktif") {
    query = query.eq("is_active", true)
  } else if (activeFilter === "nonaktif") {
    query = query.eq("is_active", false)
  }

  const { data: users } = await query

  const roleColor: Record<string, string> = {
    mahasiswa: "text-blue-600 border-blue-200",
    employer: "text-purple-600 border-purple-200",
    admin: "text-red-600 border-red-200",
  }

  const roleLabel: Record<string, string> = {
    mahasiswa: "Mahasiswa",
    employer: "Employer",
    admin: "Admin",
  }

  // Count per filter for badges
  const { data: allUsers } = await adminSupabase
    .from("profiles")
    .select("role, is_active")

  const counts = {
    semua: allUsers?.length ?? 0,
    mahasiswa: allUsers?.filter(u => u.role === "mahasiswa").length ?? 0,
    employer: allUsers?.filter(u => u.role === "employer").length ?? 0,
    admin: allUsers?.filter(u => u.role === "admin").length ?? 0,
    aktif: allUsers?.filter(u => u.is_active).length ?? 0,
    nonaktif: allUsers?.filter(u => !u.is_active).length ?? 0,
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Kelola Pengguna</h1>
        <p className="text-slate-600 mt-1">Lihat dan kelola akun pengguna platform.</p>
      </div>

      <UserFilterButtons active={activeFilter} counts={counts} />

      {(users ?? []).length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="font-medium">Tidak ada pengguna untuk filter ini.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Nama</th>
                  <th className="px-6 py-4 font-medium">Peran</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Bergabung</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((u: any) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {u.full_name || "Tanpa Nama"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={roleColor[u.role] ?? "text-slate-600 border-slate-200"}>
                        {roleLabel[u.role] ?? u.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(u.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.id !== user.id && (
                        <ToggleUserStatus userId={u.id} isActive={u.is_active} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
