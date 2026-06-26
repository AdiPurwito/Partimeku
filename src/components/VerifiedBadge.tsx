import { BadgeCheck } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface VerifiedBadgeProps {
  className?: string
  size?: number
}

export default function VerifiedBadge({ className = "", size = 16 }: VerifiedBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex items-center cursor-help border-none bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-full" aria-label="Employer Terverifikasi">
          <BadgeCheck 
            size={size} 
            className={`text-indigo-400 fill-indigo-400/20 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] ${className}`} 
          />
      </TooltipTrigger>
      <TooltipContent className="bg-zinc-900 border border-zinc-800 text-zinc-200 shadow-xl px-2.5 py-1 text-xs rounded-md">
        Employer Terverifikasi
      </TooltipContent>
    </Tooltip>
  )
}
