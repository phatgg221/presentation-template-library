import type { Slide, Theme } from "../content/types"

/**
 * Layout engine: turns a slide + theme into absolutely positioned boxes on a 1280×720 canvas.
 * The React SlideRenderer (thumbnails, preview, editor, present mode) and the PPTX exporter both
 * draw these same boxes, so what users see is what they download.
 *
 * Units: px on a 1280×720 canvas = 96 px per inch = PowerPoint's 13.333×7.5 in widescreen layout.
 * Font sizes are in points (pt), like PowerPoint.
 */
export const CANVAS = { width: 1280, height: 720 } as const
export const PX_PER_INCH = 96

type Geometry = { x: number; y: number; w: number; h: number }

export type ShapeBox = Geometry & {
  kind: "rect" | "ellipse"
  fill: string
  /** 0–1 */
  opacity?: number
  /** Corner radius in px (rect only). */
  radius?: number
}

export type TextBox = Geometry & {
  kind: "text"
  /** Path of the slide field this box edits, e.g. "title", "left.bullets", "stats.1.value" ("" = decorative). */
  field: string
  text: string
  /** When set, each line is rendered as a bullet point. */
  bullets?: boolean
  font: "heading" | "body"
  size: number
  bold?: boolean
  italic?: boolean
  color: string
  align?: "left" | "center" | "right"
  valign?: "top" | "middle" | "bottom"
  /** Shown only in the editor when the field is empty. */
  placeholder: string
}

export type Box = ShapeBox | TextBox

const M = 80 // page margin
const CONTENT_W = CANVAS.width - M * 2

function text(field: string, value: string | string[] | undefined, geo: Geometry, style: Omit<TextBox, "kind" | "field" | "text" | keyof Geometry>): TextBox {
  return { kind: "text", field, text: Array.isArray(value) ? value.join("\n") : (value ?? ""), ...geo, ...style }
}

function header(slide: Slide, theme: Theme): Box[] {
  return [
    { kind: "rect", x: M, y: 64, w: 64, h: 6, fill: theme.secondary, radius: 3 },
    text("title", slide.title, { x: M, y: 86, w: CONTENT_W, h: 96 }, {
      font: "heading", size: 36, bold: true, color: theme.text, valign: "middle", placeholder: "Tiêu đề slide",
    }),
  ]
}

function background(color: string): ShapeBox {
  return { kind: "rect", x: 0, y: 0, w: CANVAS.width, h: CANVAS.height, fill: color }
}

/** Splits `total` width into `n` equal columns separated by `gap`. */
function columns(n: number, total = CONTENT_W, gap = 32) {
  const w = (total - gap * (n - 1)) / n
  return Array.from({ length: n }, (_, i) => ({ x: M + i * (w + gap), w }))
}

export function layoutSlide(slide: Slide, theme: Theme): Box[] {
  switch (slide.layout) {
    case "title":
      return [
        background(theme.primary),
        { kind: "ellipse", x: 860, y: -200, w: 640, h: 640, fill: theme.secondary, opacity: 0.25 },
        { kind: "ellipse", x: 1040, y: 420, w: 360, h: 360, fill: theme.secondary, opacity: 0.15 },
        text("kicker", slide.kicker, { x: M, y: 200, w: 760, h: 40 }, {
          font: "body", size: 16, bold: true, color: theme.secondary, valign: "bottom", placeholder: "NHÃN NHỎ",
        }),
        { kind: "rect", x: M, y: 256, w: 96, h: 8, fill: theme.secondary, radius: 4 },
        text("title", slide.title, { x: M, y: 284, w: 900, h: 200 }, {
          font: "heading", size: 48, bold: true, color: theme.onPrimary, placeholder: "Tiêu đề bài trình bày",
        }),
        text("subtitle", slide.subtitle, { x: M, y: 500, w: 900, h: 110 }, {
          font: "body", size: 22, color: theme.onPrimary, placeholder: "Phụ đề, tên người trình bày, ngày",
        }),
      ]

    case "section":
      return [
        background(theme.background),
        { kind: "rect", x: 0, y: 0, w: 420, h: CANVAS.height, fill: theme.primary },
        text("kicker", slide.kicker, { x: M, y: 220, w: 300, h: 280 }, {
          font: "heading", size: 110, bold: true, color: theme.onPrimary, valign: "middle", placeholder: "01",
        }),
        { kind: "rect", x: 500, y: 266, w: 64, h: 6, fill: theme.secondary, radius: 3 },
        text("title", slide.title, { x: 500, y: 290, w: 700, h: 140 }, {
          font: "heading", size: 40, bold: true, color: theme.text, placeholder: "Tên phần",
        }),
        text("subtitle", slide.subtitle, { x: 500, y: 440, w: 700, h: 100 }, {
          font: "body", size: 20, color: theme.muted, placeholder: "Mô tả ngắn cho phần này",
        }),
      ]

    case "title-content":
      return [
        background(theme.background),
        ...header(slide, theme),
        text("bullets", slide.bullets, { x: M, y: 210, w: CONTENT_W, h: 440 }, {
          font: "body", size: 26, color: theme.text, bullets: true, placeholder: "Mỗi dòng là một ý",
        }),
      ]

    case "two-column": {
      const [l, r] = columns(2)
      const col = (side: "left" | "right", x: number, w: number): Box[] => [
        { kind: "rect", x, y: 206, w, h: 450, fill: theme.surface, radius: 16 },
        { kind: "rect", x, y: 206, w: 8, h: 450, fill: side === "left" ? theme.primary : theme.secondary },
        text(`${side}.heading`, slide[side]?.heading, { x: x + 36, y: 230, w: w - 64, h: 56 }, {
          font: "heading", size: 26, bold: true, color: theme.primary, valign: "middle", placeholder: "Tiêu đề cột",
        }),
        text(`${side}.bullets`, slide[side]?.bullets, { x: x + 36, y: 296, w: w - 64, h: 340 }, {
          font: "body", size: 21, color: theme.text, bullets: true, placeholder: "Mỗi dòng là một ý",
        }),
      ]
      return [background(theme.background), ...header(slide, theme), ...col("left", l.x, l.w), ...col("right", r.x, r.w)]
    }

    case "stats": {
      const stats = slide.stats?.length ? slide.stats : [{ value: "", label: "" }]
      const cols = columns(stats.length)
      return [
        background(theme.background),
        ...header(slide, theme),
        ...stats.flatMap((stat, i): Box[] => [
          { kind: "rect", x: cols[i].x, y: 220, w: cols[i].w, h: 300, fill: theme.surface, radius: 20 },
          { kind: "rect", x: cols[i].x + 32, y: 252, w: 48, h: 6, fill: theme.secondary, radius: 3 },
          text(`stats.${i}.value`, stat.value, { x: cols[i].x + 32, y: 278, w: cols[i].w - 64, h: 110 }, {
            font: "heading", size: stats.length <= 2 ? 54 : stats.length === 3 ? 44 : 36, bold: true, color: theme.primary, valign: "middle", placeholder: "0%",
          }),
          text(`stats.${i}.label`, stat.label, { x: cols[i].x + 32, y: 396, w: cols[i].w - 64, h: 104 }, {
            font: "body", size: 20, color: theme.muted, placeholder: "Mô tả chỉ số",
          }),
        ]),
        text("subtitle", slide.subtitle, { x: M, y: 560, w: CONTENT_W, h: 90 }, {
          font: "body", size: 18, italic: true, color: theme.muted, placeholder: "Ghi chú / nguồn số liệu",
        }),
      ]
    }

    case "timeline": {
      const items = slide.items?.length ? slide.items : [{ label: "", text: "" }]
      const cols = columns(items.length, CONTENT_W, 24)
      return [
        background(theme.background),
        ...header(slide, theme),
        { kind: "rect", x: M, y: 368, w: CONTENT_W, h: 4, fill: theme.secondary, opacity: 0.5 },
        ...items.flatMap((item, i): Box[] => [
          text(`items.${i}.label`, item.label, { x: cols[i].x, y: 270, w: cols[i].w, h: 76 }, {
            font: "heading", size: 26, bold: true, color: theme.primary, valign: "bottom", placeholder: "Mốc",
          }),
          { kind: "ellipse", x: cols[i].x, y: 356, w: 28, h: 28, fill: theme.primary },
          text(`items.${i}.text`, item.text, { x: cols[i].x, y: 404, w: cols[i].w, h: 240 }, {
            font: "body", size: 19, color: theme.text, placeholder: "Nội dung",
          }),
        ]),
      ]
    }

    case "quote":
      return [
        background(theme.surface),
        { kind: "rect", x: 0, y: 0, w: 16, h: CANVAS.height, fill: theme.primary },
        text("", "“", { x: M + 20, y: 40, w: 200, h: 200 }, {
          font: "heading", size: 160, bold: true, color: theme.secondary, placeholder: "",
        }),
        text("quote", slide.quote, { x: 180, y: 200, w: 940, h: 300 }, {
          font: "heading", size: 36, italic: true, color: theme.text, valign: "middle", placeholder: "Câu trích dẫn",
        }),
        { kind: "rect", x: 180, y: 532, w: 48, h: 4, fill: theme.secondary, radius: 2 },
        text("author", slide.author, { x: 180, y: 552, w: 940, h: 60 }, {
          font: "body", size: 20, bold: true, color: theme.primary, valign: "middle", placeholder: "Tác giả",
        }),
      ]

    case "closing":
      return [
        background(theme.primary),
        { kind: "ellipse", x: -200, y: 380, w: 560, h: 560, fill: theme.secondary, opacity: 0.2 },
        { kind: "ellipse", x: 1000, y: -160, w: 420, h: 420, fill: theme.secondary, opacity: 0.2 },
        text("kicker", slide.kicker, { x: M, y: 180, w: CONTENT_W, h: 40 }, {
          font: "body", size: 16, bold: true, color: theme.secondary, align: "center", valign: "bottom", placeholder: "NHÃN NHỎ",
        }),
        text("title", slide.title, { x: M, y: 236, w: CONTENT_W, h: 150 }, {
          font: "heading", size: 52, bold: true, color: theme.onPrimary, align: "center", valign: "middle", placeholder: "Cảm ơn!",
        }),
        text("subtitle", slide.subtitle, { x: 160, y: 400, w: CANVAS.width - 320, h: 140 }, {
          font: "body", size: 20, color: theme.onPrimary, align: "center", placeholder: "Thông tin liên hệ",
        }),
      ]
  }
}

/** Fields that exist for each layout — used by the editor to reset content when switching layout. */
export const LAYOUT_LABELS: Record<Slide["layout"], string> = {
  title: "Trang bìa",
  section: "Mở đầu phần",
  "title-content": "Tiêu đề + nội dung",
  "two-column": "Hai cột",
  stats: "Chỉ số nổi bật",
  timeline: "Dòng thời gian",
  quote: "Trích dẫn",
  closing: "Kết thúc",
}

/** Reads a field path such as "left.bullets" or "stats.1.value" from a slide. */
export function getField(slide: Slide, path: string): string {
  const value = path.split(".").reduce<unknown>((obj, key) => (obj as Record<string, unknown> | undefined)?.[key], slide)
  return Array.isArray(value) ? value.join("\n") : typeof value === "string" ? value : ""
}

/** Immutably writes a field path. Bullet fields receive one item per line. */
export function setField(slide: Slide, path: string, raw: string): Slide {
  const keys = path.split(".")
  const isList = keys[keys.length - 1] === "bullets"
  const value: unknown = isList ? raw.split("\n").map((l) => l.trim()).filter(Boolean) : raw
  const write = (target: unknown, depth: number): unknown => {
    const key = keys[depth]
    const isIndex = /^\d+$/.test(key)
    const base: Record<string, unknown> | unknown[] = Array.isArray(target)
      ? [...target]
      : { ...((target as Record<string, unknown>) ?? (isIndex ? [] : {})) }
    const next = depth === keys.length - 1 ? value : write((base as Record<string, unknown>)[key], depth + 1)
    ;(base as Record<string, unknown>)[key] = next
    return base
  }
  return write(slide, 0) as Slide
}

let counter = 0
export function newSlideId() {
  counter += 1
  return `s-${Date.now().toString(36)}-${counter.toString(36)}`
}

/** Starter content when a user adds a slide or switches layout. */
export function blankSlide(layout: Slide["layout"], from?: Slide): Slide {
  const base: Slide = { id: from?.id ?? newSlideId(), layout, title: from?.title ?? "", notes: from?.notes }
  switch (layout) {
    case "title":
    case "closing":
    case "section":
      return { ...base, subtitle: from?.subtitle ?? "", kicker: from?.kicker ?? (layout === "section" ? "01" : "") }
    case "title-content":
      return { ...base, bullets: from?.bullets ?? ["Ý chính thứ nhất", "Ý chính thứ hai", "Ý chính thứ ba"] }
    case "two-column":
      return {
        ...base,
        left: from?.left ?? { heading: "Cột trái", bullets: ["Ý thứ nhất", "Ý thứ hai"] },
        right: from?.right ?? { heading: "Cột phải", bullets: ["Ý thứ nhất", "Ý thứ hai"] },
      }
    case "stats":
      return {
        ...base,
        subtitle: from?.subtitle ?? "",
        stats: from?.stats ?? [
          { value: "120%", label: "Tăng trưởng" },
          { value: "4.8/5", label: "Mức hài lòng" },
          { value: "35", label: "Đối tác" },
        ],
      }
    case "timeline":
      return {
        ...base,
        items: from?.items ?? [
          { label: "Q1", text: "Khởi động" },
          { label: "Q2", text: "Triển khai" },
          { label: "Q3", text: "Mở rộng" },
        ],
      }
    case "quote":
      return { ...base, quote: from?.quote ?? "Câu trích dẫn truyền cảm hứng.", author: from?.author ?? "Tác giả" }
  }
}
