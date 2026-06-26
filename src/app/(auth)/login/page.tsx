"use client"
import { useState, useTransition, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { login } from "../actions"
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
import { AlertCircle, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
})

function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect")

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  function onSubmit(values: z.infer<typeof loginSchema>) {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.append("email", values.email)
      formData.append("password", values.password)
      const result = await login(formData)
      if (result?.error) {
        setError("Email atau password salah. Silakan coba lagi.")
        return
      }
      if (redirectTo) {
        window.location.href = redirectTo
      } else if (result?.redirectTo) {
        window.location.href = result.redirectTo
      }
    })
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
          Selamat datang kembali 👋
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Masuk untuk melanjutkan perjalanan karir part-time kamu.
        </p>
      </div>
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium text-zinc-300">Password</FormLabel>
                  <Link href="/forgot-password" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                    Lupa password?
                  </Link>
                </div>
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
          <Button
            type="submit"
            disabled={isPending}
            className="mt-2 h-11 w-full rounded-xl bg-indigo-600 font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/30 disabled:opacity-50"
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</>
            ) : (
              "Masuk ke Akun"
            )}
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm text-zinc-600">
        Belum punya akun?{" "}
        <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
          Daftar sekarang →
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
