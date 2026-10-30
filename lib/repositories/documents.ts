import "server-only"
import { randomUUID } from "node:crypto"
import { getDb } from "../db"
import { cloneContent } from "../content/clone"
import type { SlideDeck, TemplateKind } from "../content/types"
import type { DocumentRecord, DocumentSummary } from "./types"
import { templatesRepo } from "./templates"

type Row = {
  id: string
  kind: TemplateKind
  template_id: string | null
  template_version: number
  template_name: string | null
  title: string
  content?: string
  created_at: string
  updated_at: string
}

const SELECT = `SELECT d.id, d.kind, d.template_id, d.template_version, t.name AS template_name, d.title,
  d.created_at, d.updated_at`

function toSummary(row: Row): DocumentSummary {
  return {
    id: row.id,
    kind: row.kind,
    templateId: row.template_id,
    templateVersion: row.template_version,
    templateName: row.template_name,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const documentsRepo = {
  /**
   * Creates a user document from a template. The template content is deep-cloned into a new row;
   * the template row and its original file are only read, never written.
   */
  createFromTemplate(templateId: string, title?: string): DocumentRecord | null {
    const template = templatesRepo.get(templateId)
    if (!template || !template.isPublished) return null
    const id = randomUUID()
    const now = new Date().toISOString()
    getDb()
      .prepare(`INSERT INTO documents (id, kind, template_id, template_version, title, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, template.kind, template.id, template.version, title ?? template.name, JSON.stringify(cloneContent(template.content)), now, now)
    return this.get(id)
  },

  list(kind?: TemplateKind): DocumentSummary[] {
    const rows = getDb()
      .prepare(`${SELECT} FROM documents d LEFT JOIN templates t ON t.id = d.template_id
        ${kind ? "WHERE d.kind = ?" : ""} ORDER BY d.updated_at DESC LIMIT 200`)
      .all(...(kind ? [kind] : [])) as Row[]
    return rows.map(toSummary)
  },

  get(id: string): DocumentRecord | null {
    const row = getDb()
      .prepare(`${SELECT}, d.content FROM documents d LEFT JOIN templates t ON t.id = d.template_id WHERE d.id = ?`)
      .get(id) as Row | undefined
    return row ? { ...toSummary(row), content: JSON.parse(row.content!) } : null
  },

  update(id: string, patch: { title?: string; content?: SlideDeck }): DocumentRecord | null {
    const current = this.get(id)
    if (!current) return null
    getDb()
      .prepare("UPDATE documents SET title = ?, content = ?, updated_at = ? WHERE id = ?")
      .run(patch.title ?? current.title, JSON.stringify(patch.content ?? current.content), new Date().toISOString(), id)
    return this.get(id)
  },

  delete(id: string): boolean {
    return getDb().prepare("DELETE FROM documents WHERE id = ?").run(id).changes > 0
  },
}
