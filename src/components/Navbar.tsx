"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getInitials } from "@/lib/utils"
import { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogOut, LayoutDashboard, User, Briefcase, ChevronDown } from "lucide-react"
import { toast } from "sonner"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const isLoggingOut = useRef(false)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()

      if (error) {
        // PGRST116 = no rows returned, user profile doesn't exist yet
        if (error.code !== "PGRST116") {
          console.warn("Navbar profile fetch warning:", error.code, error.message)
        }
        setProfile(null)
        return
      }
      setProfile(data)
    } catch (err) {
      // Silently ignore — user is just not logged in or profile not yet created
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await fetchProfile(user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      } catch {
        setProfile(null)
        setLoading(false)
      }
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isLoggingOut.current) return
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      isLoggingOut.current = true
      setProfile(null)
      setIsOpen(false)

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      window.location.href = "/"
    } catch (err: any) {
      isLoggingOut.current = false
      toast.error(err.message || "Gagal keluar")
    }
  }

  const getDashboardLink = (role: string) => {
    switch (role) {
      case "admin":
        return "/dashboard/admin"
      case "employer":
        return "/dashboard/employer"
      case "mahasiswa":
      default:
        return "/dashboard/mahasiswa"
    }
  }

  const getProfileLink = (role: string) => {
    switch (role) {
      case "admin":
        return "/dashboard/admin"
      case "employer":
        return "/dashboard/employer/profil"
      case "mahasiswa":
      default:
        return "/dashboard/mahasiswa/profil"
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950 transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="bg-gradient-primary rounded-lg p-1.5 text-zinc-50 shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-300">
                <Briefcase size={20} className="stroke-[2.5]" />
              </span>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-200 bg-clip-text text-transparent">
                Partime<span className="text-indigo-400">ku</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/jobs"
              className={`text-sm font-medium transition-colors hover:text-indigo-400 ${
                pathname === "/jobs" ? "text-indigo-400" : "text-zinc-300"
              }`}
            >
              Cari Lowongan
            </Link>

            {(!profile || profile.role === "employer") && (
              <Link
                href="/dashboard/employer/lowongan"
                className={`text-sm font-medium transition-colors hover:text-indigo-400 ${
                  pathname.startsWith("/dashboard/employer/lowongan") ? "text-indigo-400" : "text-zinc-300"
                }`}
              >
                Pasang Lowongan
              </Link>
            )}

            {profile && (
              <Link
                href={getDashboardLink(profile.role)}
                className={`text-sm font-medium transition-colors hover:text-indigo-400 ${
                  pathname.startsWith(getDashboardLink(profile.role)) ? "text-indigo-400" : "text-zinc-300"
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Desktop User Account Actions */}
          <div className="hidden md:flex items-center gap-4">
            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-800" />
            ) : profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="relative flex items-center gap-2 pl-2 pr-3 py-1.5 h-auto rounded-full hover:bg-zinc-900 border border-zinc-800/50 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 bg-transparent cursor-pointer">
                  <Avatar className="h-7 w-7 border border-zinc-700">
                    <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name || ""} />
                    <AvatarFallback className="bg-zinc-800 text-xs font-semibold text-zinc-300">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-zinc-300 max-w-[100px] truncate">
                    {profile.full_name}
                  </span>
                  <ChevronDown size={14} className="text-zinc-500" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-zinc-300">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold text-zinc-100">{profile.full_name}</p>
                      <p className="text-xs text-zinc-500 capitalize">{profile.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-800" />

                  <DropdownMenuItem className="hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer p-0">
                    <Link href={getDashboardLink(profile.role)} className="flex w-full items-center gap-2 px-2 py-1.5">
                      <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>

                  {profile.role !== "admin" && (
                    <DropdownMenuItem className="hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer p-0">
                      <Link href={getProfileLink(profile.role)} className="flex w-full items-center gap-2 px-2 py-1.5">
                        <User size={16} />
                        <span>Profil Saya</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-400 hover:bg-red-950/20 hover:text-red-300 cursor-pointer"
                  >
                    <LogOut size={16} className="mr-2" />
                    <span>Keluar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50 font-medium"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm bg-gradient-primary text-zinc-50 font-semibold hover:opacity-90 transition-opacity border-0 shadow-lg shadow-indigo-600/10"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile navigation toggle */}
          <div className="flex md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger className="inline-flex items-center justify-center rounded-md h-10 w-10 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50">
                <Menu size={24} />
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] bg-zinc-950 border-l border-zinc-800 text-zinc-300 flex flex-col justify-between"
              >
                <div>
                  <SheetHeader className="mb-8">
                    <SheetTitle className="flex items-center gap-2 text-left">
                      <span className="bg-gradient-primary rounded-lg p-1 text-zinc-50">
                        <Briefcase size={16} className="stroke-[2.5]" />
                      </span>
                      <span className="text-lg font-bold text-zinc-100">
                        Partime<span className="text-indigo-400">ku</span>
                      </span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex flex-col gap-4">
                    <Link
                      href="/jobs"
                      onClick={() => setIsOpen(false)}
                      className={`text-base font-medium px-2 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors ${
                        pathname === "/jobs" ? "text-indigo-400 bg-zinc-900/40" : "text-zinc-300"
                      }`}
                    >
                      Cari Lowongan
                    </Link>

                    {(!profile || profile.role === "employer") && (
                      <Link
                        href="/dashboard/employer/lowongan"
                        onClick={() => setIsOpen(false)}
                        className={`text-base font-medium px-2 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors ${
                          pathname.startsWith("/dashboard/employer/lowongan")
                            ? "text-indigo-400 bg-zinc-900/40"
                            : "text-zinc-300"
                        }`}
                      >
                        Pasang Lowongan
                      </Link>
                    )}

                    {profile && (
                      <>
                        <Link
                          href={getDashboardLink(profile.role)}
                          onClick={() => setIsOpen(false)}
                          className={`text-base font-medium px-2 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors ${
                            pathname.startsWith(getDashboardLink(profile.role))
                              ? "text-indigo-400 bg-zinc-900/40"
                              : "text-zinc-300"
                          }`}
                        >
                          Dashboard
                        </Link>

                        {profile.role !== "admin" && (
                          <Link
                            href={getProfileLink(profile.role)}
                            onClick={() => setIsOpen(false)}
                            className={`text-base font-medium px-2 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors ${
                              pathname.startsWith(getProfileLink(profile.role))
                                ? "text-indigo-400 bg-zinc-900/40"
                                : "text-zinc-300"
                            }`}
                          >
                            Profil Saya
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="pb-8 border-t border-zinc-900 pt-6">
                  {profile ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 px-2">
                        <Avatar className="h-10 w-10 border border-zinc-800">
                          <AvatarImage src={profile.avatar_url || ""} />
                          <AvatarFallback className="bg-zinc-800 text-sm font-semibold">
                            {getInitials(profile.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-zinc-100">{profile.full_name}</p>
                          <p className="text-xs text-zinc-500 capitalize">{profile.role}</p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 mt-2 bg-red-950/20 text-red-400 hover:bg-red-950/45 hover:text-red-300 border border-red-900/50"
                      >
                        <LogOut size={16} />
                        <span>Keluar</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm w-full border border-zinc-800 text-zinc-300 hover:bg-zinc-900 font-medium"
                      >
                        Masuk
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm w-full bg-gradient-primary text-zinc-50 border-0 font-medium"
                      >
                        Daftar
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
