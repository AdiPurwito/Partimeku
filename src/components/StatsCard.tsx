import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  subtext?: string
  trend?: string
  className?: string
  iconClassName?: string
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  subtext,
  trend,
  className = "",
  iconClassName = "",
}: StatsCardProps) {
  return (
    <Card className={`relative overflow-hidden bg-white border-slate-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md group ${className}`}>
      {/* Subtle hover glow */}
      <div className="absolute -right-12 -top-12 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl group-hover:bg-blue-600/10 transition-all duration-500" />
      
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-semibold text-slate-500 tracking-widest uppercase leading-tight">{title}</p>
          <div className={`p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 group-hover:text-blue-600 group-hover:border-blue-200 group-hover:bg-blue-50 transition-all duration-300 shrink-0 ${iconClassName}`}>
            <Icon size={18} className="transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
        <h3 className="text-4xl font-bold tracking-tight text-slate-900 leading-none">{value}</h3>
        {(subtext || trend) && (
          <p className="text-xs text-slate-500 mt-2 font-medium">{trend || subtext}</p>
        )}
      </CardContent>
    </Card>
  )
}
