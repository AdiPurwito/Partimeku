// src/components/RevenueCard.tsx
// Dipasang di dashboard admin, sejajar dengan StatsCard yang sudah ada

import { TrendingUp, TrendingDown, Minus, CircleDollarSign, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface RevenueCardProps {
  totalPemasukan: number
  pemasukkanBulanIni: number
  pemasukkanBulanLalu: number
  menungguKonfirmasi: number
  totalTransaksi: number
}

function rupiahCompact(n: number): string {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace(".0", "")} Jt`
  if (n >= 1_000)     return `Rp ${(n / 1_000).toFixed(0)} Rb`
  return `Rp ${n.toLocaleString("id-ID")}`
}

export default function RevenueCard({
  totalPemasukan,
  pemasukkanBulanIni,
  pemasukkanBulanLalu,
  menungguKonfirmasi,
  totalTransaksi,
}: RevenueCardProps) {
  // Hitung tren bulan ini vs bulan lalu
  const tren =
    pemasukkanBulanLalu === 0
      ? null
      : ((pemasukkanBulanIni - pemasukkanBulanLalu) / pemasukkanBulanLalu) * 100

  const TrenIcon =
    tren === null ? Minus :
    tren > 0 ? TrendingUp : TrendingDown

  const trenColor =
    tren === null ? "text-slate-400" :
    tren > 0 ? "text-emerald-600" : "text-red-500"

  return (
    <Card className="relative overflow-hidden bg-white border-slate-200 hover:border-emerald-300 transition-all duration-300 shadow-sm hover:shadow-md group">
      {/* Glow */}
      <div className="absolute -right-12 -top-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />

      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 group-hover:text-emerald-600 group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-all duration-300">
              <CircleDollarSign size={18} />
            </div>
            <p className="text-xs font-semibold text-slate-500 tracking-widest uppercase">
              Pemasukan Platform
            </p>
          </div>
          <Link
            href="/dashboard/admin/payments"
            className="text-xs text-slate-400 hover:text-emerald-600 transition-colors underline underline-offset-2"
          >
            Lihat semua →
          </Link>
        </div>

        {/* 3 metric utama */}
        <div className="grid grid-cols-3 gap-6">
          {/* Total all time */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Total Semua Waktu</p>
            <p className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
              {rupiahCompact(totalPemasukan)}
            </p>
            <p className="text-xs text-slate-500 mt-2">{totalTransaksi} transaksi</p>
          </div>

          {/* Bulan ini */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Bulan Ini</p>
            <p className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
              {rupiahCompact(pemasukkanBulanIni)}
            </p>
            {tren !== null && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${trenColor}`}>
                <TrenIcon size={12} />
                {Math.abs(tren).toFixed(0)}% vs bulan lalu
              </div>
            )}
          </div>

          {/* Menunggu konfirmasi */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Menunggu Konfirmasi</p>
            <div className="flex items-center gap-2">
              <p className={`text-3xl font-bold tracking-tight leading-none ${menungguKonfirmasi > 0 ? "text-amber-500" : "text-slate-900"}`}>
                {menungguKonfirmasi}
              </p>
              {menungguKonfirmasi > 0 && (
                <Clock size={16} className="text-amber-400 animate-pulse" />
              )}
            </div>
            <Link
              href="/dashboard/admin/payments"
              className={`text-xs mt-2 block ${menungguKonfirmasi > 0 ? "text-amber-500 hover:text-amber-600" : "text-slate-400"} transition-colors`}
            >
              {menungguKonfirmasi > 0 ? "Konfirmasi sekarang →" : "Tidak ada pending"}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
