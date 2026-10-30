"use client"

import { memo, useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import type { Slide, Theme } from "@/lib/content/types"
import { CANVAS, getField, layoutSlide, type Box, type TextBox } from "@/lib/slides/layout"
import { cn } from "@/lib/utils"

const PT_TO_PX = 96 / 72
const FONT_STACK: Record<string, string> = {
  Arial: "Arial, Helvetica, sans-serif",
  Calibri: "Calibri, Carlito, 'Segoe UI', sans-serif",
  Georgia: "Georgia, 'Times New Roman', serif",
  "Segoe UI": "'Segoe UI', system-ui, -apple-system, sans-serif",
  Tahoma: "Tahoma, Verdana, sans-serif",
  "Times New Roman": "'Times New Roman', Times, serif",
  "Trebuchet MS": "'Trebuchet MS', Helvetica, sans-serif",
  Verdana: "Verdana, Geneva, sans-serif",
}

type EditProps = {
  /** Field path currently being edited (shows a textarea). */
  activeField?: string | null
  onActivate?: (field: string) => void
  onCommit?: (field: string, value: string) => void
}

function textStyle(box: TextBox, theme: Theme): CSSProperties {
  return {
    fontFamily: FONT_STACK[box.font === "heading" ? theme.fontHeading : theme.fontBody],
    fontSize: box.size * PT_TO_PX,
    fontWeight: box.bold ? 700 : 400,
    fontStyle: box.italic ? "italic" : "normal",
    color: box.color,
    textAlign: box.align ?? "left",
    lineHeight: 1.15,
  }
}

function TextContent({ box, theme, placeholder }: { box: TextBox; theme: Theme; placeholder?: boolean }) {
  const lines = box.text.split("\n")
  if (placeholder) return <span className="opacity-35">{box.placeholder}</span>
  if (box.bullets) {
    return (
      <ul className="m-0 list-none p-0">
        {lines.filter((l) => l.trim()).map((line, i) => (
          <li key={i} className="relative" style={{ paddingLeft: box.size * 1.2 * PT_TO_PX, marginBottom: box.size * 0.5 * PT_TO_PX }}>
            <span className="absolute left-0" style={{ color: theme.secondary }}>
              •
            </span>
            {line}
          </li>
        ))}
      </ul>
    )
  }
  return <span className="whitespace-pre-wrap">{box.text}</span>
}

function BoxView({ box, theme, edit }: { box: Box; theme: Theme; edit?: EditProps }) {
  const position: CSSProperties = { position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h }
  if (box.kind !== "text") {
    return (
      <div
        style={{
          ...position,
          background: box.fill,
          opacity: box.opacity ?? 1,
          borderRadius: box.kind === "ellipse" ? "50%" : box.radius,
        }}
      />
    )
  }
  const editable = Boolean(edit?.onCommit && box.field)
  const empty = !box.text.trim()
  if (!editable && empty) return null
  const justify = box.valign === "middle" ? "center" : box.valign === "bottom" ? "flex-end" : "flex-start"

  if (editable && edit?.activeField === box.field) {
    return (
      <textarea
        autoFocus
        defaultValue={box.text}
        aria-label={box.placeholder}
        // Templates are full of [placeholders]: select everything so typing replaces it.
        onFocus={(e) => e.currentTarget.select()}
        onBlur={(e) => edit.onCommit!(box.field, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") (e.target as HTMLTextAreaElement).blur()
          if (e.key === "Enter" && !box.bullets && !e.shiftKey) {
            e.preventDefault()
            ;(e.target as HTMLTextAreaElement).blur()
          }
        }}
        className="resize-none overflow-hidden rounded-md bg-white/90 p-0 outline-none ring-4 ring-blue-500"
        style={{ ...position, ...textStyle(box, theme), color: "#0f172a" }}
      />
    )
  }

  return (
    <div
      style={{ ...position, ...textStyle(box, theme), display: "flex", flexDirection: "column", justifyContent: justify, overflow: "hidden" }}
      {...(editable
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": `Sửa: ${box.placeholder}`,
            onClick: () => edit!.onActivate?.(box.field),
            onKeyDown: (e: React.KeyboardEvent) => e.key === "Enter" && edit!.onActivate?.(box.field),
            className: "cursor-text rounded-md outline-2 outline-offset-4 outline-blue-400/0 transition hover:outline-blue-400/70 hover:outline-dashed focus-visible:outline-blue-500",
          }
        : {})}
    >
      <div>
        <TextContent box={box} theme={theme} placeholder={editable && empty} />
      </div>
    </div>
  )
}

/** Unscaled 1280×720 slide. */
export const SlideCanvas = memo(function SlideCanvas({ slide, theme, edit }: { slide: Slide; theme: Theme; edit?: EditProps }) {
  const boxes = layoutSlide(slide, theme)
  return (
    <div className="relative overflow-hidden" style={{ width: CANVAS.width, height: CANVAS.height, background: theme.background }}>
      {boxes.map((box, i) => (
        <BoxView key={box.kind === "text" && box.field ? box.field : `b${i}`} box={box} theme={theme} edit={edit} />
      ))}
    </div>
  )
})

/** Slide scaled to the width of its container (16:9). */
export function ScaledSlide({
  slide,
  theme,
  className,
  edit,
  label,
}: {
  slide: Slide
  theme: Theme
  className?: string
  edit?: EditProps
  label?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setScale(el.clientWidth / CANVAS.width)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={cn("relative aspect-video w-full overflow-hidden", className)}
      style={{ background: theme.background }}
      role={edit ? undefined : "img"}
      aria-label={edit ? undefined : (label ?? slide.title ?? "Slide")}
    >
      <div
        className={cn("absolute left-0 top-0 origin-top-left", !edit && "pointer-events-none select-none")}
        style={{ transform: `scale(${scale})`, visibility: scale ? "visible" : "hidden" }}
        aria-hidden={edit ? undefined : true}
      >
        <SlideCanvas slide={slide} theme={theme} edit={edit} />
      </div>
    </div>
  )
}

export { getField }
