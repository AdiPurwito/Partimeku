"use client"

// src/app/dashboard/admin/payments/ConfirmPaymentButton.tsx

import { useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"

export default function ConfirmPaymentButton({ paymentId }: { paymentId: string }) {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handleConfirm() {
    if (!confirm("Konfirmasi pembayaran ini dan aktifkan paket Pro employer?")) return

    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.rpc("confirm_payment", {
        payment_id:    paymentId,
        admin_user_id: user.id,
      })

      if (error) { alert("Gagal konfirmasi: " + error.message); return }

      setDone(true)
      setTimeout(() => window.location.reload(), 800)
    })
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
        <CheckCircle2 className="w-4 h-4" /> Dikonfirmasi!
      </span>
    )
  }

  return (
    <Button
      size="sm"
      className="bg-green-600 hover:bg-green-700 h-8 gap-1.5 text-xs"
      onClick={handleConfirm}
      disabled={isPending}
    >
      {isPending
        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Memproses...</>
        : <><CheckCircle2 className="w-3.5 h-3.5" /> Konfirmasi Lunas</>
      }
    </Button>
  )
}
