import "server-only"
import { randomUUID } from "node:crypto"
import { buildSearchText, getDb } from "../db"
import { normalizeSearch } from "../text"
import type { TemplateCreateInput, TemplateListQuery, TemplateUpdateInput } from "../schemas"
import type { Paginated, Template, TemplateSummary } from "./types"
import type { TemplateKind } from "../content/types"

type Row = {
  id: string
  slug: string
  kind: TemplateKind
  name: string
  description: string
  category: string
  tags: string
  thumbnail_url: string | null
  file_path: string | null
  content: string
  version: number
  is_published: number
  created_at: string
  updated_at: string
}

export class ConflictError extends Error {}

const viCollator = new Intl.Collator("vi", { sensitivity: "base" })

function toTemplate(row: Row): Template {
  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    name: row.name,
    description: row.description,
    category: row.category,
    tags: JSON.parse(row.tags),
    thumbnailUrl: row.thumbnail_url,
    fileUrl: `/api/templates/${row.id}/file`,
    originalFile: row.file_path === null ? null : "generated",
    content: JSON.parse(row.content),
    version: row.version,
    isPublished: row.is_published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toSummary(row: Row): TemplateSummary {
  const { content, ...rest } = toTemplate(row)
  return { ...rest, slideCount: content.slides.length, theme: content.theme, previewSlides: content.slides.slice(0, 4) }
}

export const templatesRepo = {
  list(query: TemplateListQuery & { includeUnpublished?: boolean }): Paginated<TemplateSummary> {
    const where: string[] = []
    const params: (string | number)[] = []
    if (!query.includeUnpublished) where.push("is_published = 1")
    if (query.kind) {
      where.push("kind = ?")
      params.push(query.kind)
    }
    if (query.category) {
      where.push("category = ?")
      params.push(query.category)
    }
    const q = query.q ? normalizeSearch(query.q) : ""
    if (q) {
      // Every word must match (accent-insensitive). LIKE wildcards in user input are escaped.
      for (const word of q.split(" ").filter(Boolean)) {
        where.push("search_text LIKE ? ESCAPE '\\'")
        params.push(`%${word.replace(/[\\%_]/g, (c) => `\\${c}`)}%`)
      }
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""
    // When searching, templates whose metadata (name, description, tags) contains the phrase come first.
    const relevance = q ? "CASE WHEN instr(search_text, ?) BETWEEN 1 AND instr(search_text, ' | ') THEN 0 ELSE 1 END, " : ""
    const db = getDb()
    const offset = (query.page - 1) * query.limit
    const rankParams = q ? [q] : []
    const { total } = db.prepare(`SELECT COUNT(*) AS total FROM templates ${whereSql}`).get(...params) as { total: number }
    if (query.sort === "name") {
      // SQLite sorts by byte value ("Đ" after "Z"); a template catalogue is small, so sort with a
      // Vietnamese collator in JS and paginate afterwards.
      const rows = db.prepare(`SELECT * FROM templates ${whereSql}`).all(...params) as Row[]
      rows.sort((a, b) => viCollator.compare(a.name, b.name))
      return { items: rows.slice(offset, offset + query.limit).map(toSummary), total, page: query.page, limit: query.limit }
    }
    const rows = db
      .prepare(`SELECT * FROM templates ${whereSql} ORDER BY ${relevance}created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, ...rankParams, query.limit, offset) as Row[]
    return { items: rows.map(toSummary), total, page: query.page, limit: query.limit }
  },

  categories(kind?: TemplateKind): { category: string; count: number }[] {
    const sql = `SELECT category, COUNT(*) AS count FROM templates WHERE is_published = 1 ${kind ? "AND kind = ?" : ""}
      GROUP BY category ORDER BY count DESC, category ASC`
    return getDb()
      .prepare(sql)
      .all(...(kind ? [kind] : [])) as { category: string; count: number }[]
  },

  get(id: string): Template | null {
    const row = getDb().prepare("SELECT * FROM templates WHERE id = ?").get(id) as Row | undefined
    return row ? toTemplate(row) : null
  },

  filePath(id: string): string | null {
    const row = getDb().prepare("SELECT file_path FROM templates WHERE id = ?").get(id) as { file_path: string | null } | undefined
    return row?.file_path ?? null
  },

  /** Records the generated original file once; never overwrites an existing one. */
  attachFileIfMissing(id: string, filePath: string): string {
    getDb().prepare("UPDATE templates SET file_path = ? WHERE id = ? AND file_path IS NULL").run(filePath, id)
    return this.filePath(id)!
  },

  create(input: TemplateCreateInput, filePath: string | null = null): Template {
    const db = getDb()
    if (db.prepare("SELECT 1 FROM templates WHERE slug = ?").get(input.slug)) {
      throw new ConflictError(`Slug "${input.slug}" đã tồn tại`)
    }
    const id = randomUUID()
    const now = new Date().toISOString()
    db.prepare(`INSERT INTO templates
      (id, slug, kind, name, description, category, tags, thumbnail_url, file_path, content, search_text, version, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`).run(
      id, input.slug, input.kind, input.name, input.description, input.category, JSON.stringify(input.tags),
      input.thumbnailUrl ?? null, filePath, JSON.stringify(input.content), buildSearchText(input),
      input.isPublished ? 1 : 0, now, now,
    )
    return this.get(id)!
  },

  /** Admin-only update. Content changes bump the version; existing user documents keep their own copy. */
  update(id: string, input: TemplateUpdateInput, filePath?: string | null): Template | null {
    const current = this.get(id)
    if (!current) return null
    if (input.slug && input.slug !== current.slug && getDb().prepare("SELECT 1 FROM templates WHERE slug = ?").get(input.slug)) {
      throw new ConflictError(`Slug "${input.slug}" đã tồn tại`)
    }
    const next = { ...current, ...input, thumbnailUrl: input.thumbnailUrl === undefined ? current.thumbnailUrl : input.thumbnailUrl }
    const contentChanged = input.content !== undefined || filePath !== undefined
    getDb()
      .prepare(`UPDATE templates SET slug=?, name=?, description=?, category=?, tags=?, thumbnail_url=?, content=?, search_text=?,
        is_published=?, version=?, file_path=?, updated_at=? WHERE id=?`)
      .run(
        next.slug, next.name, next.description, next.category, JSON.stringify(next.tags), next.thumbnailUrl ?? null,
        JSON.stringify(next.content), buildSearchText(next), next.isPublished ? 1 : 0,
        contentChanged ? current.version + 1 : current.version,
        // A new content version gets a new original file (regenerated on first download).
        filePath !== undefined ? filePath : contentChanged ? null : this.filePath(id),
        new Date().toISOString(), id,
      )
    return this.get(id)
  },
}
