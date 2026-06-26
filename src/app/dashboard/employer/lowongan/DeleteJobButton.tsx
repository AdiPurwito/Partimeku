"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function DeleteJobButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus lowongan ini?")) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from("jobs").delete().eq("id", jobId)
    setLoading(false)
    router.refresh()
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-8 text-red-600 hover:bg-red-50 border-red-200"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  )
}
