"use client"

import { useState } from "react"
import { Star, StarHalf } from "lucide-react"

interface StarRatingProps {
  rating: number
  maxStars?: number
  editable?: boolean
  onChange?: (rating: number) => void
  size?: number
  className?: string
  showValue?: boolean
}

export default function StarRating({
  rating,
  maxStars = 5,
  editable = false,
  onChange,
  size = 16,
  className = "",
  showValue = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const handleStarClick = (value: number) => {
    if (editable && onChange) {
      onChange(value)
    }
  }

  const handleMouseEnter = (value: number) => {
    if (editable) {
      setHoverRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (editable) {
      setHoverRating(null)
    }
  }

  const activeRating = hoverRating !== null ? hoverRating : rating

  const renderStars = () => {
    const stars = []
    for (let i = 1; i <= maxStars; i++) {
      if (editable) {
        // Editable mode: simple whole stars based on hover or selected rating
        const isFilled = i <= activeRating
        stars.push(
          <button
            key={i}
            type="button"
            onClick={() => handleStarClick(i)}
            onMouseEnter={() => handleMouseEnter(i)}
            onMouseLeave={handleMouseLeave}
            className="focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer"
          >
            <Star
              size={size}
              className={`${
                isFilled
                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]"
                  : "fill-zinc-800 text-zinc-600"
              } transition-colors duration-150`}
            />
          </button>
        )
      } else {
        // Read-only mode: handles fractions (like 4.5)
        const diff = rating - (i - 1)
        if (diff >= 1) {
          // Full star
          stars.push(
            <Star
              key={i}
              size={size}
              className="fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]"
            />
          )
        } else if (diff > 0 && diff < 1) {
          // Half star
          stars.push(
            <div key={i} className="relative inline-block">
              <Star size={size} className="fill-zinc-800 text-zinc-700" />
              <div className="absolute top-0 left-0 overflow-hidden w-[50%]">
                <Star size={size} className="fill-amber-400 text-amber-400" />
              </div>
            </div>
          )
        } else {
          // Empty star
          stars.push(
            <Star key={i} size={size} className="fill-zinc-800 text-zinc-700" />
          )
        }
      }
    }
    return stars
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">{renderStars()}</div>
      {showValue && (
        <span className="text-sm font-semibold text-zinc-300 ml-1.5">
          {rating.toFixed(1)}<span className="text-zinc-500 font-normal">/{maxStars}</span>
        </span>
      )}
    </div>
  )
}
