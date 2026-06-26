"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { register } from "../actions"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  AlertCircle,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  GraduationCap,
  Briefcase,
} from "lucide-react"

const registerSchema = z.object({
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
  full_name: z.string().min(3, { message: "Nama minimal 3 karakter" }),
  role: z.enum(["mahasiswa", "employer"]),
})

const roleOptions = [
  {
    value: "mahasiswa" as const,
    label: "Mahasiswa",
    description: "Cari kerja part-time",
    icon: GraduationCap,
  },
  {
    value: "employer" as const,
    label: "Employer",
    description: "Pasang lowongan",
    icon: Briefcase,
  },
]

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      role: "mahasiswa",
    },
  })

  const selectedRole = form.watch("role")

  function onSubmit(values: z.infer<typeof registerSchema>) {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.append("email", values.email)
      formData.append("password", values.password)
      formData.append("full_name", values.full_name)
      formData.append("role", values.role)

      const result = await register(formData)
      if (result?.error) {
        setError(result.error)
        return
      }

      // Hard navigation to ensure cookies are sent with the request
      if (result?.redirectTo) {
        window.location.href = result.redirectTo
      }
    })
  }

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
          Buat Akun Baru 🚀
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Gratis selamanya. Mulai dalam 60 detik.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

          {/* Role Selector */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-zinc-300">
                  Saya mendaftar sebagai
                </FormLabel>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {roleOptions.map((opt) => {
                    const Icon = opt.icon
                    const isSelected = field.value === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isPending}
                        onClick={() => field.onChange(opt.value)}
                        className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200 ${
                          isSelected
                            ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-300 shadow-lg shadow-indigo-900/20"
                            : "border-white/8 bg-white/[0.02] text-zinc-500 hover:border-white/15 hover:bg-white/5"
                        }`}
                      >
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                          isSelected
                            ? "border-indigo-500/30 bg-indigo-500/15"
                            : "border-white/10 bg-white/5"
                        }`}>
                          <Icon size={18} className={isSelected ? "text-indigo-400" : "text-zinc-500"} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-zinc-400"}`}>
                            {opt.label}
                          </p>
                          <p className={`text-xs mt-0.5 ${isSelected ? "text-indigo-400" : "text-zinc-600"}`}>
                            {opt.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <FormMessage className="text-xs text-red-400" />
              </FormItem>
            )}
          />

          {/* Full Name */}
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-zinc-300">
                  {selectedRole === "employer" ? "Nama Penanggung Jawab" : "Nama Lengkap"}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    {selectedRole === "employer" ? (
                      <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                    ) : (
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                    )}
                    <Input
                      placeholder={selectedRole === "employer" ? "Nama pemilik / HR" : "Nama lengkap kamu"}
                      {...field}
                      disabled={isPending}
                      className="h-11 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-600 focus-visible:border-indigo-500/60 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-red-400" />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-zinc-300">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                    <Input
                      placeholder="nama@email.com"
                      {...field}
                      disabled={isPending}
                      className="h-11 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-600 focus-visible:border-indigo-500/60 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-red-400" />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-zinc-300">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      {...field}
                      disabled={isPending}
                      className="h-11 rounded-xl border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder:text-zinc-600 focus-visible:border-indigo-500/60 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-red-400" />
              </FormItem>
            )}
          />

          {/* Submit */}
          <Button
            type="submit"
            disabled={isPending}
            className="mt-2 h-11 w-full rounded-xl bg-indigo-600 font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/30 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mendaftarkan akun...
              </>
            ) : (
              "Buat Akun Gratis"
            )}
          </Button>

          <p className="text-center text-xs text-zinc-600">
            Dengan mendaftar, kamu menyetujui{" "}
            <Link href="/tos" className="text-zinc-500 hover:text-zinc-400 underline underline-offset-2">
              Syarat & Ketentuan
            </Link>{" "}
            kami.
          </p>
        </form>
      </Form>

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-zinc-600">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
          Masuk di sini →
        </Link>
      </p>
    </div>
  )
}
