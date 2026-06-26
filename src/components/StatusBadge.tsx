import { getStatusColor, getStatusLabel } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: string
  className?: string
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const colorClass = getStatusColor(status)
  const label = getStatusLabel(status)

  return (
    <Badge 
      variant="outline" 
      className={`font-medium px-2.5 py-0.5 text-xs transition-all border ${colorClass} ${className}`}
    >
      {label}
    </Badge>
  )
}
