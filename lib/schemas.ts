import { z } from "zod"
import { FONTS, LAYOUTS } from "./content/types"

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Màu phải ở dạng #RRGGBB")
const line = (max = 300) => z.string().max(max)
const bulletList = z.array(line(300)).max(10)

export const themeSchema = z.object({
  name: z.string().trim().min(1).max(60),
  primary: color,
  onPrimary: color,
  secondary: color,
  background: color,
  surface: color,
  text: color,
  muted: color,
  fontHeading: z.enum(FONTS),
  fontBody: z.enum(FONTS),
})

export const slideSchema = z.object({
  id: z.string().min(1).max(64),
  layout: z.enum(LAYOUTS),
  title: line(200).optional(),
  subtitle: line(300).optional(),
  kicker: line(60).optional(),
  bullets: bulletList.optional(),
  left: z.object({ heading: line(120), bullets: bulletList }).optional(),
  right: z.object({ heading: line(120), bullets: bulletList }).optional(),
  stats: z.array(z.object({ value: line(24), label: line(120) })).max(4).optional(),
  items: z.array(z.object({ label: line(40), text: line(200) })).max(5).optional(),
  quote: line(500).optional(),
  author: line(120).optional(),
  notes: line(5000).optional(),
})

export const deckSchema = z.object({
  theme: themeSchema,
  slides: z.array(slideSchema).min(1, "Bộ slide cần ít nhất 1 slide").max(60),
})

export const kindSchema = z.enum(["document", "presentation"])

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang")

const tagsSchema = z.array(z.string().trim().min(1).max(40)).max(20)

export const templateCreateSchema = z.object({
  kind: z.literal("presentation").default("presentation"),
  slug: slugSchema,
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  category: z.string().trim().min(2).max(60),
  tags: tagsSchema.default([]),
  thumbnailUrl: z.string().trim().url().max(500).nullable().optional(),
  content: deckSchema,
  isPublished: z.boolean().default(true),
})
export type TemplateCreateInput = z.infer<typeof templateCreateSchema>

export const templateUpdateSchema = templateCreateSchema.omit({ kind: true }).partial()
export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>

export const templateListQuerySchema = z.object({
  kind: kindSchema.optional(),
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  sort: z.enum(["newest", "name"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
})
export type TemplateListQuery = z.infer<typeof templateListQuerySchema>

export const documentCreateSchema = z.object({
  templateId: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
})

export const documentPatchSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: deckSchema.optional(),
  })
  .refine((v) => v.title !== undefined || v.content !== undefined, "Cần ít nhất title hoặc content")

export const uuidSchema = z.string().uuid()
