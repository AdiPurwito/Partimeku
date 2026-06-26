import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Always call getUser() to refresh the session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected dashboard routes
  const dashboardRoutes = ["/dashboard"]
  const isDashboardRoute = dashboardRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // If accessing dashboard without login → redirect to login
  if (isDashboardRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // If logged in, get user role for role-based access
  if (user && isDashboardRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    // Profile not yet created (race condition after register) — let the page handle it
    if (profile) {
      const role = profile.role

      // Role-based route protection
      if (pathname.startsWith("/dashboard/mahasiswa") && role !== "mahasiswa") {
        const url = request.nextUrl.clone()
        url.pathname = role === "admin" ? "/dashboard/admin" : "/dashboard/employer"
        return NextResponse.redirect(url)
      }
      if (pathname.startsWith("/dashboard/employer") && role !== "employer") {
        const url = request.nextUrl.clone()
        url.pathname = role === "admin" ? "/dashboard/admin" : "/dashboard/mahasiswa"
        return NextResponse.redirect(url)
      }
      if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
        const url = request.nextUrl.clone()
        url.pathname = role === "employer" ? "/dashboard/employer" : "/dashboard/mahasiswa"
        return NextResponse.redirect(url)
      }
    }
  }

  // If logged in and accessing auth pages → redirect to dashboard
  if (user && (pathname === "/login" || pathname === "/register")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profile) {
      const url = request.nextUrl.clone()
      switch (profile.role) {
        case "mahasiswa":
          url.pathname = "/dashboard/mahasiswa"
          break
        case "employer":
          url.pathname = "/dashboard/employer"
          break
        case "admin":
          url.pathname = "/dashboard/admin"
          break
        default:
          url.pathname = "/"
      }
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
