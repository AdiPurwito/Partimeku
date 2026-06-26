"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Ban, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ToggleUserStatus({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async () => {
    if (!confirm(isActive ? "Nonaktifkan akun ini?" : "Aktifkan kembali akun ini?")) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from("profiles").update({ is_active: !isActive }).eq("id", userId)
    setLoading(false)
    router.refresh()
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className={isActive ? "text-yellow-600 border-yellow-200 hover:bg-yellow-50" : "text-green-600 border-green-200 hover:bg-green-50"}
      onClick={toggle}
      disabled={loading}
    >
      {isActive ? (
        <><Ban className="w-4 h-4 mr-1" /> Nonaktifkan</>
      ) : (
        <><CheckCircle2 className="w-4 h-4 mr-1" /> Aktifkan</>
      )}
    </Button>
  )
}
