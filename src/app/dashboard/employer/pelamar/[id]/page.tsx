// import { createClient } from "@/lib/supabase/server"
// import { redirect } from "next/navigation"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import Link from "next/link"

// export default async function KelolaPelamarPage() {
//   const supabase = await createClient()

//   const { data: { user } } = await supabase.auth.getUser()
//   if (!user) redirect("/login")

//   // Guard: only employer
//   const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
//   if (profile?.role !== "employer") redirect("/dashboard")

//   // Step 1: fetch job IDs milik employer ini
//   const { data: myJobs } = await supabase
//     .from("jobs")
//     .select("id, judul")
//     .eq("employer_id", user.id)

//   const jobIds = (myJobs ?? []).map((j: any) => j.id)
//   const jobMap: Record<string, string> = {}
//   for (const j of myJobs ?? []) jobMap[j.id] = j.judul

//   // Step 2: fetch applications hanya untuk job-job tersebut
//   // Hindari nested join ke mahasiswa_profiles karena tidak ada FK langsung
//   // dari applications.mahasiswa_id → mahasiswa_profiles.user_id
//   let allApps: any[] = []
//   if (jobIds.length > 0) {
//     const { data: applications, error: appsError } = await supabase
//       .from("applications")
//       .select(`
//         id,
//         status,
//         applied_at,
//         job_id,
//         mahasiswa_id,
//         mahasiswa:profiles!applications_mahasiswa_id_fkey (
//           id,
//           full_name,
//           avatar_url
//         )
//       `)
//       .in("job_id", jobIds)
//       .order("applied_at", { ascending: false })

//     if (appsError) console.error("[pelamar] applications error:", appsError)

//     const apps = applications ?? []

//     // Step 3: fetch mahasiswa_profiles terpisah menggunakan mahasiswa_id list
//     const mahasiswaIds = [...new Set(apps.map((a: any) => a.mahasiswa_id))]
//     let mProfileMap: Record<string, any> = {}

//     if (mahasiswaIds.length > 0) {
//       const { data: mProfiles, error: mErr } = await supabase
//         .from("mahasiswa_profiles")
//         .select("user_id, universitas, jurusan, semester")
//         .in("user_id", mahasiswaIds)

//       if (mErr) console.error("[pelamar] mahasiswa_profiles error:", mErr)
//       for (const mp of mProfiles ?? []) {
//         mProfileMap[mp.user_id] = mp
//       }
//     }

//     // Gabungkan data
//     allApps = apps.map((app: any) => ({
//       ...app,
//       mahasiswa_profile: mProfileMap[app.mahasiswa_id] ?? null,
//       job: { id: app.job_id, judul: jobMap[app.job_id] ?? "-" },
//     }))
//   }

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "diterima": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Diterima</Badge>
//       case "ditolak": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Ditolak</Badge>
//       default: return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Menunggu</Badge>
//     }
//   }

//   const getInitials = (name: string) =>
//     name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?"

//   return (
//     <div className="p-6 max-w-5xl mx-auto">
//       <div className="mb-8">
//         <h1 className="text-2xl font-bold text-slate-900">Kelola Pelamar</h1>
//         <p className="text-slate-600 mt-1">Review dan kelola lamaran dari mahasiswa.</p>
//       </div>

//       {allApps.length === 0 ? (
//         <div className="text-center py-16 text-slate-500">
//           <p className="font-medium text-lg">Belum ada pelamar</p>
//           <p className="text-sm mt-1">Pelamar akan muncul di sini setelah ada yang melamar ke lowongan Anda.</p>
//         </div>
//       ) : (
//         <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm text-left">
//               <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
//                 <tr>
//                   <th className="px-6 py-4 font-medium">Nama Pelamar</th>
//                   <th className="px-6 py-4 font-medium">Posisi</th>
//                   <th className="px-6 py-4 font-medium">Universitas</th>
//                   <th className="px-6 py-4 font-medium">Status</th>
//                   <th className="px-6 py-4 font-medium">Tanggal</th>
//                   <th className="px-6 py-4 font-medium text-right">Aksi</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {allApps.map((app: any) => (
//                   <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
//                     <td className="px-6 py-4">
//                       <div className="flex items-center gap-3">
//                         <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
//                           {getInitials(app.mahasiswa?.full_name ?? "")}
//                         </div>
//                         <div>
//                           <span className="font-medium text-slate-900">{app.mahasiswa?.full_name ?? "Pelamar"}</span>
//                           {app.mahasiswa_profile?.jurusan && (
//                             <p className="text-xs text-slate-500">{app.mahasiswa_profile.jurusan}</p>
//                           )}
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       {app.job?.id ? (
//                         <Link href={`/jobs/${app.job.id}`} className="text-slate-600 hover:text-blue-600 hover:underline">
//                           {app.job.judul}
//                         </Link>
//                       ) : (
//                         <span className="text-slate-600">{app.job?.judul ?? "-"}</span>
//                       )}
//                     </td>
//                     <td className="px-6 py-4 text-slate-600">
//                       {app.mahasiswa_profile?.universitas ?? "-"}
//                     </td>
//                     <td className="px-6 py-4">
//                       {getStatusBadge(app.status)}
//                     </td>
//                     <td className="px-6 py-4 text-slate-600">
//                       {new Date(app.applied_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
//                     </td>
//                     <td className="px-6 py-4 text-right">
//                       <Link href={`/dashboard/employer/pelamar/${app.id}`}>
//                         <Button size="sm" variant="outline" className="h-8 text-slate-600 hover:text-blue-600 hover:border-blue-300">
//                           Lihat Detail
//                         </Button>
//                       </Link>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }
