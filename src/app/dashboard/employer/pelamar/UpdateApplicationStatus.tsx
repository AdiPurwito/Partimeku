"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function UpdateApplicationStatus({ applicationId }: { applicationId: string }) {
  const [loading, setLoading] = useState<"diterima" | "ditolak" | null>(null)
  const router = useRouter()

  const updateStatus = async (status: "diterima" | "ditolak") => {
    setLoading(status)
    const supabase = createClient()
    await supabase
      .from("applications")
      .update({ status })
      .eq("id", applicationId)
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700 h-8"
        onClick={() => updateStatus("diterima")}
        disabled={loading !== null}
      >
        <CheckCircle2 className="w-4 h-4 mr-1" />
        {loading === "diterima" ? "..." : "Terima"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 hover:bg-red-50 border-red-200 h-8"
        onClick={() => updateStatus("ditolak")}
        disabled={loading !== null}
      >
        <XCircle className="w-4 h-4 mr-1" />
        {loading === "ditolak" ? "..." : "Tolak"}
      </Button>
    </div>
  )
}
