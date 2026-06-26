"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Star, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function UlasanForm({
  applicationId,
  employerId,
}: {
  applicationId: string
  employerId: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [komentar, setKomentar] = useState("")

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Pilih rating terlebih dahulu.")
      return
    }
    if (!employerId) {
      toast.error("Data employer tidak ditemukan.")
      return
    }

    startTransition(async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error("Sesi habis, silakan login ulang."); return }

      const { error } = await supabase.from("reviews").insert({
        application_id: applicationId,
        employer_id: employerId,
        mahasiswa_id: user.id,
        rating,
        komentar: komentar.trim() || null,
      })

      if (error) {
        if (error.code === "23505") {
          toast.error("Kamu sudah pernah memberi ulasan untuk lamaran ini.")
        } else {
          toast.error("Gagal mengirim ulasan. Coba lagi.")
          console.error(error)
        }
        return
      }

      toast.success("Ulasan berhasil dikirim! Terima kasih. 🌟")
      router.push("/dashboard/mahasiswa/lamaran")
      router.refresh()
    })
  }

  const displayRating = hovered || rating

  return (
    <div className="space-y-6">
      {/* Star Rating */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-3">Rating keseluruhan</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110 focus:outline-none"
              aria-label={`${star} bintang`}
            >
              <Star
                className={`h-9 w-9 transition-colors ${
                  star <= displayRating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-none text-slate-300"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-3 text-sm font-medium text-slate-600">
              {["", "Sangat Buruk", "Buruk", "Cukup", "Baik", "Sangat Baik"][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Komentar */}
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-2">
          Komentar <span className="text-slate-400 font-normal">(opsional)</span>
        </label>
        <Textarea
          placeholder="Ceritakan pengalamanmu bekerja di sini — suasana kerja, pembayaran gaji, komunikasi, dll."
          className="h-32 resize-none"
          value={komentar}
          onChange={(e) => setKomentar(e.target.value)}
          maxLength={500}
        />
        <p className="text-xs text-slate-400 mt-1 text-right">{komentar.length}/500</p>
      </div>

      <div className="pt-2 flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={isPending || rating === 0}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</>
          ) : (
            <><Send className="mr-2 h-4 w-4" /> Kirim Ulasan</>
          )}
        </Button>
      </div>

      <p className="text-xs text-slate-400">
        Ulasan bersifat publik dan akan tampil di profil perusahaan. Pastikan ulasanmu jujur dan sopan.
      </p>
    </div>
  )
}
