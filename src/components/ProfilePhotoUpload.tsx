"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { getInitials } from "@/lib/utils"
import { Upload, Camera, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface ProfilePhotoUploadProps {
  userId: string
  fullName: string | null
  currentAvatarUrl: string | null
  onUploadComplete: (newUrl: string) => void
}

export default function ProfilePhotoUpload({
  userId,
  fullName,
  currentAvatarUrl,
  onUploadComplete,
}: ProfilePhotoUploadProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Format file harus berupa gambar (JPEG, PNG, WebP)")
      return
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal adalah 2MB")
      return
    }

    await uploadPhoto(file)
  }

  const uploadPhoto = async (file: File) => {
    setUploading(true)
    setProgress(10)

    try {
      // Local preview immediately
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
      
      setProgress(30)
      
      const fileExt = file.name.split(".").pop()
      const filePath = `${userId}/avatar.${fileExt}` // e.g. userId/avatar.png

      setProgress(50)

      // Upload file to Supabase Storage bucket 'avatars'
      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      setProgress(80)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      // Append timestamp to bust browser cache
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`

      // Save avatar_url to profiles table
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ avatar_url: cacheBustedUrl })
        .eq("id", userId)

      if (dbError) throw dbError

      setProgress(100)
      toast.success("Foto profil berhasil diperbarui")
      onUploadComplete(cacheBustedUrl)
    } catch (err: any) {
      console.error("Error uploading photo:", err)
      toast.error(err.message || "Gagal mengunggah foto profil")
      // Revert preview on failure
      setPreviewUrl(currentAvatarUrl)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm w-full max-w-sm mx-auto">
      <div className="relative group">
        {/* Avatar container */}
        <Avatar className="h-24 w-24 border-2 border-zinc-800 group-hover:border-indigo-500/60 transition-all duration-300 shadow-lg">
          <AvatarImage src={previewUrl || ""} alt={fullName || "User"} className="object-cover" />
          <AvatarFallback className="bg-zinc-800 text-xl font-bold text-zinc-300">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>

        {/* Upload Overlay */}
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
        >
          <Camera className="text-zinc-100" size={24} />
        </button>

        {/* Spinner when uploading */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-zinc-950/80 z-10">
            <Loader2 className="animate-spin text-indigo-400" size={24} />
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-zinc-200">Foto Profil</p>
        <p className="text-xs text-zinc-500 mt-1">PNG, JPG, atau WebP (Maks. 2MB)</p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={uploading}
      />

      <Button
        type="button"
        variant="outline"
        onClick={triggerFileInput}
        disabled={uploading}
        className="border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 w-full"
      >
        <Upload size={16} className="mr-2" />
        {uploading ? "Mengunggah..." : "Pilih Foto"}
      </Button>

      {uploading && (
        <div className="w-full mt-2">
          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
            <span>Mengunggah file...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1 bg-zinc-800 [&>div]:bg-indigo-500" />
        </div>
      )}
    </div>
  )
}
