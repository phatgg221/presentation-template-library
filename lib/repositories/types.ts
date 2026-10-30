import type { Slide, SlideDeck, TemplateKind, Theme } from "../content/types"

export type Template = {
  id: string
  slug: string
  kind: TemplateKind
  name: string
  description: string
  category: string
  tags: string[]
  thumbnailUrl: string | null
  fileUrl: string
  /** "generated": the original .pptx rendered once from content and stored; null until first download. */
  originalFile: "generated" | null
  content: SlideDeck
  version: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

/** Lightweight list item: no full content, only the theme + first slides for thumbnails. */
export type TemplateSummary = Omit<Template, "content"> & { slideCount: number; theme: Theme; previewSlides: Slide[] }

export type DocumentRecord = {
  id: string
  kind: TemplateKind
  templateId: string | null
  templateVersion: number
  templateName: string | null
  title: string
  content: SlideDeck
  createdAt: string
  updatedAt: string
}

export type DocumentSummary = Omit<DocumentRecord, "content">

export type Paginated<T> = { items: T[]; total: number; page: number; limit: number }
