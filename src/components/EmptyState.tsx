import { LucideIcon, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface EmptyStateProps {
  title: string
  description: string
  icon?: LucideIcon
  actionLabel?: string
  actionHref?: string
  onActionClick?: () => void
  className?: string
}

export default function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  actionHref,
  onActionClick,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/10 backdrop-blur-sm ${className}`}>
      {/* Icon with glowing backdrop */}
      <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 mb-5">
        <div className="absolute inset-0 rounded-full bg-indigo-500/5 blur-md" />
        <Icon size={28} className="relative z-10 text-zinc-400" />
      </div>

      <h3 className="text-lg font-semibold text-zinc-200 tracking-tight">{title}</h3>
      <p className="text-sm text-zinc-400 mt-2 max-w-sm leading-relaxed">{description}</p>

      {actionLabel && (
        <div className="mt-6">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:opacity-90"
            >
              {actionLabel}
            </Link>
          ) : (
            <Button 
              onClick={onActionClick} 
              className="bg-gradient-primary text-zinc-50 font-medium hover:opacity-90 shadow-lg shadow-indigo-600/20 border-0"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
