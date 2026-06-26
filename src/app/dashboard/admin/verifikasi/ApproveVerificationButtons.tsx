"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { updateVerificationStatus } from "./actions"

export default function ApproveVerificationButtons({
  requestId,
  employerId,
}: {
  requestId: string
  employerId: string
}) {
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null)
  const router = useRouter()

  const handleAction = async (status: "approved" | "rejected") => {
    setLoading(status)
    const result = await updateVerificationStatus(requestId, employerId, status)
    if (result?.error) {
      console.error("Gagal update:", result.error)
    }
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700 h-8"
        onClick={() => handleAction("approved")}
        disabled={loading !== null}
      >
        <CheckCircle2 className="w-4 h-4 mr-1" />
        {loading === "approved" ? "..." : "Setujui"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 hover:bg-red-50 border-red-200 h-8"
        onClick={() => handleAction("rejected")}
        disabled={loading !== null}
      >
        <XCircle className="w-4 h-4 mr-1" />
        {loading === "rejected" ? "..." : "Tolak"}
      </Button>
    </div>
  )
}
