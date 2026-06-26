"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function ReviewModerationButtons({ reviewId }: { reviewId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<"abaikan" | "hapus" | null>(null)

  const handleIgnore = async () => {
    setLoading("abaikan")
    const supabase = createClient()

    const { error } = await supabase
      .from("reviews")
      .update({ is_reported: false })
      .eq("id", reviewId)

    setLoading(null)

    if (error) {
      toast.error("Gagal mengabaikan laporan.")
      console.error(error)
      return
    }

    toast.success("Laporan diabaikan — ulasan tetap ditampilkan.")
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm("Hapus ulasan ini secara permanen?")) return
    setLoading("hapus")
    const supabase = createClient()

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId)

    setLoading(null)

    if (error) {
      toast.error("Gagal menghapus ulasan.")
      console.error(error)
      return
    }

    toast.success("Ulasan berhasil dihapus.")
    router.refresh()
  }

  return (
    <div className="flex gap-3 justify-end">
      <Button
        variant="outline"
        className="text-slate-600 hover:text-green-600 hover:bg-green-50 border-slate-200"
        onClick={handleIgnore}
        disabled={loading !== null}
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        {loading === "abaikan" ? "Memproses..." : "Abaikan Laporan"}
      </Button>
      <Button
        className="bg-red-600 hover:bg-red-700 text-white"
        onClick={handleDelete}
        disabled={loading !== null}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {loading === "hapus" ? "Menghapus..." : "Hapus Ulasan"}
      </Button>
    </div>
  )
}
