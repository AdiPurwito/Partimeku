"use client"
import { useState, useMemo } from "react"

type DayData = {
  date: string // "YYYY-MM-DD"
  mahasiswa: number
  employer: number
  jobs: number
  applications: number
}

type Props = {
  data: DayData[]
}

const SERIES = [
  { key: "mahasiswa" as keyof DayData, color: "#3b82f6", label: "Mahasiswa baru" },
  { key: "employer" as keyof DayData, color: "#a855f7", label: "Employer baru" },
  { key: "jobs" as keyof DayData, color: "#14b8a6", label: "Lowongan baru" },
  { key: "applications" as keyof DayData, color: "#f97316", label: "Lamaran masuk" },
]

const toLocalISO = (d: Date) => {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

const addDays = (dateStr: string, n: number) => {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + n)
  return toLocalISO(d)
}

export default function GrowthChart({ data }: Props) {
  const today = toLocalISO(new Date())

  const [startDate, setStartDate] = useState(addDays(today, -13))
  const [endDate, setEndDate] = useState(today)

  const isInvalid = startDate > endDate

  const filtered = useMemo(() => {
    return data.filter((d) => d.date >= startDate && d.date <= endDate)
  }, [data, startDate, endDate])

  const maxVal = Math.max(...filtered.flatMap((d) => SERIES.map((s) => d[s.key] as number)), 1)

  const W = 680
  const H = 200
  const PAD = { top: 16, right: 12, bottom: 36, left: 32 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom

  const n = filtered.length || 1
  const groupW = cW / n
  const barW = Math.max(3, Math.min(10, groupW * 0.18))
  const gap = Math.max(1, barW * 0.25)
  const totalBarsW = SERIES.length * barW + (SERIES.length - 1) * gap
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(t * maxVal))

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 lg:col-span-2">
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-slate-900">Grafik Pertumbuhan Platform</h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Dari</label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Sampai</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={today}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          {isInvalid ? (
            <span className="text-xs text-red-500 font-medium">Tanggal awal tidak boleh lebih dari akhir</span>
          ) : (
            <span className="text-xs text-slate-400">{filtered.length} hari</span>
          )}
        </div>
      </div>

      {isInvalid ? (
        <div className="flex items-center justify-center h-48 text-sm text-slate-400">
          Pilih rentang tanggal yang valid
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm text-slate-400">
          Tidak ada data pada rentang tanggal ini
        </div>
      ) : (
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 360 }}>
            <g transform={`translate(${PAD.left},${PAD.top})`}>
              {yTicks.map((tick, i) => {
                const y = cH - (tick / maxVal) * cH
                return (
                  <g key={i}>
                    <line x1={0} y1={y} x2={cW} y2={y} stroke="#e2e8f0" strokeWidth={1} />
                    <text x={-5} y={y + 3.5} textAnchor="end" fontSize={9} fill="#94a3b8">{tick}</text>
                  </g>
                )
              })}
              {filtered.map((d, i) => {
                const xGroup = i * groupW
                const startX = xGroup + (groupW - totalBarsW) / 2
                return (
                  <g key={d.date}>
                    {SERIES.map((s, si) => {
                      const val = d[s.key] as number
                      const bh = Math.max((val / maxVal) * cH, val > 0 ? 2 : 0)
                      const x = startX + si * (barW + gap)
                      const y = cH - bh
                      return (
                        <rect key={s.key} x={x} y={y} width={barW} height={bh}
                          fill={s.color} rx={1.5} opacity={0.85} />
                      )
                    })}
                    {(n <= 14 || i % Math.ceil(n / 14) === 0) && (
                      <text x={xGroup + groupW / 2} y={cH + 13}
                        textAnchor="middle" fontSize={8} fill="#94a3b8">
                        {d.date.slice(5)}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          </svg>
        </div>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: s.color }} />
            <span className="text-xs text-slate-600">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
