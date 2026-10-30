"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { SlideCanvas } from "@/components/slides/slide-canvas"
import type { SlideDeck } from "@/lib/content/types"
import { CANVAS } from "@/lib/slides/layout"

/** Fullscreen slideshow: →/Space/click = next, ← = previous, Home/End, Esc = exit. */
export function PresentMode({ deck, start, onClose }: { deck: SlideDeck; start: number; onClose: (index: number) => void }) {
  const [index, setIndex] = useState(start)
  const [scale, setScale] = useState(1)
  const total = deck.slides.length

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / CANVAS.width, window.innerHeight / CANVAS.height))
    fit()
    window.addEventListener("resize", fit)
    document.documentElement.requestFullscreen?.().catch(() => {})
    return () => {
      window.removeEventListener("resize", fit)
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", " ", "PageDown"].includes(e.key)) setIndex((i) => Math.min(i + 1, total - 1))
      else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) setIndex((i) => Math.max(i - 1, 0))
      else if (e.key === "Home") setIndex(0)
      else if (e.key === "End") setIndex(total - 1)
      else if (e.key === "Escape") onClose(index)
      else return
      e.preventDefault()
    }
    const onFullscreenExit = () => !document.fullscreenElement && onClose(index)
    window.addEventListener("keydown", onKey)
    document.addEventListener("fullscreenchange", onFullscreenExit)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("fullscreenchange", onFullscreenExit)
    }
  }, [index, total, onClose])

  return (
    <div className="group fixed inset-0 z-[100] flex items-center justify-center bg-black" role="dialog" aria-modal="true" aria-label="Chế độ trình chiếu">
      <div
        onClick={() => setIndex((i) => Math.min(i + 1, total - 1))}
        style={{ width: CANVAS.width * scale, height: CANVAS.height * scale }}
        className="relative cursor-pointer overflow-hidden"
      >
        <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})` }}>
          <SlideCanvas slide={deck.slides[index]} theme={deck.theme} />
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
        <span aria-live="polite">
          {index + 1} / {total}
        </span>
        <span className="text-white/50">← → để chuyển • Esc để thoát</span>
      </div>
      <button
        onClick={() => onClose(index)}
        aria-label="Thoát trình chiếu"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white opacity-0 transition hover:bg-white/20 group-hover:opacity-100 focus:opacity-100"
      >
        <X className="size-5" />
      </button>
    </div>
  )
}
