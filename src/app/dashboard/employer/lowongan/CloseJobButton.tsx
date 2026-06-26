"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function CloseJobButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClose = async () => {
    if (!confirm("Tutup lowongan ini? Lowongan tidak akan menerima pelamar baru, tapi masih bisa diedit.")) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from("jobs").update({ status: "closed" }).eq("id", jobId)
    setLoading(false)
    router.refresh()
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-8 text-amber-600 hover:bg-amber-50 border-amber-200 gap-1.5"
      onClick={handleClose}
      disabled={loading}
    >
      <XCircle className="w-3.5 h-3.5" /> Tutup
    </Button>
  )
}
