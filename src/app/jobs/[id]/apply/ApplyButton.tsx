"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function ApplyButton({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleApply = () => {
    startTransition(async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Kamu harus login terlebih dahulu.")
        router.push("/login")
        return
      }

      const { error } = await supabase.from("applications").insert({
        job_id: jobId,
        mahasiswa_id: user.id,
        status: "menunggu",
      })

      if (error) {
        if (error.code === "23505") {
          toast.error("Kamu sudah pernah melamar lowongan ini.")
        } else {
          toast.error("Gagal mengirim lamaran. Coba lagi.")
          console.error(error)
        }
        return
      }

      toast.success("Lamaran berhasil dikirim! 🎉")
      router.push("/dashboard/mahasiswa/lamaran")
      router.refresh()
    })
  }

  return (
    <Button
      onClick={handleApply}
      disabled={isPending}
      className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Mengirim Lamaran...
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          Kirim Lamaran Sekarang
        </>
      )}
    </Button>
  )
}
