"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ApproveJobButtons({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null)
  const router = useRouter()

  const updateStatus = async (status: "approved" | "rejected") => {
    setLoading(status)
    const supabase = createClient()
    await supabase.from("jobs").update({ status }).eq("id", jobId)
    setLoading(null)
    router.refresh()
  }

  return (
    <>
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700 h-8"
        onClick={() => updateStatus("approved")}
        disabled={loading !== null}
      >
        <CheckCircle2 className="w-4 h-4 mr-1" />
        {loading === "approved" ? "..." : "Setujui"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 hover:bg-red-50 border-red-200 h-8"
        onClick={() => updateStatus("rejected")}
        disabled={loading !== null}
      >
        <XCircle className="w-4 h-4" />
      </Button>
    </>
  )
}
