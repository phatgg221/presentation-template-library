"use client"

import { useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ScaledSlide } from "@/components/slides/slide-canvas"
import type { SlideDeck } from "@/lib/content/types"
import { cn } from "@/lib/utils"

/** Large slide + prev/next + filmstrip. Arrow keys navigate (unless typing in a field). */
export function SlideViewer({ deck, index, onIndex }: { deck: SlideDeck; index: number; onIndex: (i: number) => void }) {
  const total = deck.slides.length
  const go = (i: number) => onIndex(Math.min(Math.max(i, 0), total - 1))
  const strip = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return
      if (e.key === "ArrowRight") go(index + 1)
      if (e.key === "ArrowLeft") go(index - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  useEffect(() => {
    strip.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [index])

  const slide = deck.slides[index] ?? deck.slides[0]
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="relative">
        <ScaledSlide slide={slide} theme={deck.theme} className="rounded-lg shadow-lg ring-1 ring-black/5" label={`Slide ${index + 1}: ${slide.title ?? ""}`} />
        <button
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Slide trước"
          className="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:bg-white disabled:opacity-0"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={() => go(index + 1)}
          disabled={index === total - 1}
          aria-label="Slide sau"
          className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:bg-white disabled:opacity-0"
        >
          <ChevronRight className="size-5" />
        </button>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white" aria-live="polite">
          {index + 1} / {total}
        </span>
      </div>
      <div ref={strip} className="flex gap-3 overflow-x-auto pb-2" role="tablist" aria-label="Danh sách slide">
        {deck.slides.map((s, i) => (
          <button
            key={s.id}
            data-index={i}
            role="tab"
            aria-selected={i === index}
            aria-label={`Slide ${i + 1}`}
            onClick={() => go(i)}
            className={cn(
              "w-36 shrink-0 rounded-md p-0.5 text-left transition",
              i === index ? "ring-2 ring-blue-600" : "opacity-70 ring-1 ring-slate-200 hover:opacity-100",
            )}
          >
            <ScaledSlide slide={s} theme={deck.theme} className="rounded" />
            <span className="mt-1 block px-1 text-[11px] text-slate-500">{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
