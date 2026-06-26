"use client"

import Link from "next/link"
import { useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  if (totalPages <= 1) return null

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      if (currentPage <= 2) {
        end = 4
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3
      }

      if (start > 2) {
        pages.push("...")
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push("...")
      }

      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-2 mt-8 py-4">
      {/* Prev */}
      {currentPage > 1 ? (
        <Link href={createPageURL(currentPage - 1)}>
          <Button variant="outline" size="icon" className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white h-9 w-9 rounded-lg">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Halaman Sebelumnya</span>
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="icon" disabled className="border-zinc-900 bg-zinc-950/20 text-zinc-600 h-9 w-9 rounded-lg opacity-50 cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Page Numbers */}
      {pageNumbers.map((page, idx) => {
        if (page === "...") {
          return (
            <span key={`ellipsis-${idx}`} className="px-3 py-1.5 text-zinc-650 text-sm">
              ...
            </span>
          )
        }

        const isCurrent = page === currentPage

        return (
          <Link key={page} href={createPageURL(page)}>
            <Button
              variant={isCurrent ? "default" : "outline"}
              className={`h-9 w-9 rounded-lg text-sm font-medium transition-all ${
                isCurrent
                  ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/10"
                  : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white"
              }`}
            >
              {page}
            </Button>
          </Link>
        )
      })}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link href={createPageURL(currentPage + 1)}>
          <Button variant="outline" size="icon" className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white h-9 w-9 rounded-lg">
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Halaman Berikutnya</span>
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="icon" disabled className="border-zinc-900 bg-zinc-950/20 text-zinc-600 h-9 w-9 rounded-lg opacity-50 cursor-not-allowed">
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
