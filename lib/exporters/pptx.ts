import PptxGenJS from "pptxgenjs"
import type { SlideDeck } from "../content/types"
import { PX_PER_INCH, layoutSlide, type Box } from "../slides/layout"

/**
 * SlideDeck JSON -> real .pptx using pptxgenjs. Every slide is drawn from the same boxes as the
 * on-screen SlideRenderer (lib/slides/layout.ts), converted from px to inches. Text stays as real,
 * editable PowerPoint text boxes; speaker notes are included.
 */
const inch = (px: number) => px / PX_PER_INCH
const hex = (color: string) => color.replace("#", "").toUpperCase()

function addBox(pptx: PptxGenJS, slide: PptxGenJS.Slide, box: Box, fonts: { heading: string; body: string }) {
  const pos = { x: inch(box.x), y: inch(box.y), w: inch(box.w), h: inch(box.h) }
  if (box.kind !== "text") {
    const shape = box.kind === "ellipse" ? pptx.ShapeType.ellipse : box.radius ? pptx.ShapeType.roundRect : pptx.ShapeType.rect
    slide.addShape(shape, {
      ...pos,
      fill: { color: hex(box.fill), transparency: box.opacity !== undefined ? Math.round((1 - box.opacity) * 100) : 0 },
      line: { type: "none" },
      ...(box.kind === "rect" && box.radius ? { rectRadius: Math.min(box.radius / Math.min(box.w, box.h), 0.5) } : {}),
    })
    return
  }
  if (!box.text.trim()) return
  const common = {
    fontFace: box.font === "heading" ? fonts.heading : fonts.body,
    fontSize: box.size,
    color: hex(box.color),
    bold: box.bold,
    italic: box.italic,
    align: box.align ?? "left",
  } as const
  const lines = box.text.split("\n").filter((l) => !box.bullets || l.trim())
  slide.addText(
    lines.map((line, i) => ({
      text: line,
      options: {
        ...common,
        breakLine: i < lines.length - 1,
        ...(box.bullets ? { bullet: { indent: box.size * 1.2 }, paraSpaceAfter: box.size * 0.5 } : {}),
      },
    })),
    { ...pos, ...common, valign: box.valign ?? "top", margin: 0, lineSpacingMultiple: 1.15 },
  )
}

export function buildPptx(deck: SlideDeck, meta: { title: string }): PptxGenJS {
  const pptx = new PptxGenJS()
  pptx.layout = "LAYOUT_WIDE" // 13.333 × 7.5 in = 1280 × 720 px canvas
  pptx.title = meta.title
  pptx.author = "Presentation Template Library"
  pptx.theme = { headFontFace: deck.theme.fontHeading, bodyFontFace: deck.theme.fontBody }
  const fonts = { heading: deck.theme.fontHeading, body: deck.theme.fontBody }
  for (const s of deck.slides) {
    const slide = pptx.addSlide()
    slide.background = { color: hex(deck.theme.background) }
    for (const box of layoutSlide(s, deck.theme)) addBox(pptx, slide, box, fonts)
    if (s.notes?.trim()) slide.addNotes(s.notes)
  }
  return pptx
}

export async function deckToPptx(deck: SlideDeck, meta: { title: string }): Promise<Buffer> {
  const out = await buildPptx(deck, meta).write({ outputType: "nodebuffer" })
  return Buffer.from(out as Uint8Array)
}

export const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
