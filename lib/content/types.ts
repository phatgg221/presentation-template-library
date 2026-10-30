/**
 * Canonical editable content model for presentation templates. Templates and user
 * presentations both store this JSON; the thumbnail, preview, editor, present mode and
 * the PPTX exporter all read the same structure through one layout engine (lib/slides/layout.ts).
 */
export const LAYOUTS = ["title", "section", "title-content", "two-column", "stats", "timeline", "quote", "closing"] as const
export type SlideLayout = (typeof LAYOUTS)[number]

export const FONTS = ["Arial", "Calibri", "Georgia", "Segoe UI", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana"] as const
export type FontName = (typeof FONTS)[number]

export type Theme = {
  name: string
  /** Dominant brand colour (title/closing backgrounds, accents). */
  primary: string
  /** Text colour used on top of `primary`. */
  onPrimary: string
  /** Accent colour (bars, dots, quote marks). */
  secondary: string
  background: string
  /** Card / panel background. */
  surface: string
  text: string
  muted: string
  fontHeading: FontName
  fontBody: FontName
}

export type Column = { heading: string; bullets: string[] }
export type Stat = { value: string; label: string }
export type TimelineItem = { label: string; text: string }

export type Slide = {
  id: string
  layout: SlideLayout
  title?: string
  subtitle?: string
  /** Small label: section number on "section", eyebrow text on "title"/"closing". */
  kicker?: string
  bullets?: string[]
  left?: Column
  right?: Column
  stats?: Stat[]
  items?: TimelineItem[]
  quote?: string
  author?: string
  notes?: string
}

export type SlideDeck = { theme: Theme; slides: Slide[] }

export type TemplateKind = "document" | "presentation"
