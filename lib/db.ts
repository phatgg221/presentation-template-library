import "server-only"
import { DatabaseSync } from "node:sqlite"
import { mkdirSync } from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { presentationTemplates } from "./seed/presentation-templates"
import { normalizeSearch } from "./text"
import { deckPlainText } from "./content/deck"
import type { SlideDeck } from "./content/types"

/**
 * SQLite through Node's built-in `node:sqlite` driver: zero setup for reviewers (no Docker,
 * no cloud account). All SQL lives in /lib/repositories, so swapping to Postgres only means
 * re-implementing those two modules.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS templates (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  kind          TEXT NOT NULL CHECK (kind IN ('document','presentation')),
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL,
  tags          TEXT NOT NULL DEFAULT '[]',   -- JSON array
  thumbnail_url TEXT,
  file_path     TEXT,                          -- storage key of the original file (read-only)
  content       TEXT NOT NULL,                 -- canonical SlideDeck JSON
  search_text   TEXT NOT NULL DEFAULT '',      -- accent-free text used by search
  version       INTEGER NOT NULL DEFAULT 1,
  is_published  INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_templates_kind_category ON templates(kind, category);

CREATE TABLE IF NOT EXISTS documents (
  id               TEXT PRIMARY KEY,
  kind             TEXT NOT NULL,
  template_id      TEXT REFERENCES templates(id) ON DELETE SET NULL,
  template_version INTEGER NOT NULL,
  title            TEXT NOT NULL,
  content          TEXT NOT NULL,              -- independent copy, never shared with the template
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_documents_kind_updated ON documents(kind, updated_at);
`

export function buildSearchText(input: { name: string; description: string; category: string; tags: string[]; content: unknown }) {
  // "metadata | body": metadata matches are ranked above body-only matches (see templatesRepo.list).
  const meta = normalizeSearch([input.name, input.description, input.category, input.tags.join(" ")].join(" "))
  return `${meta} | ${normalizeSearch(deckPlainText(input.content as SlideDeck))}`
}

export function seed(db: DatabaseSync) {
  const insert = db.prepare(`INSERT OR IGNORE INTO templates
    (id, slug, kind, name, description, category, tags, thumbnail_url, file_path, content, search_text, version, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, 1, 1, ?, ?)`)
  const base = Date.parse("2026-10-01T08:00:00Z")
  presentationTemplates.forEach((t, index) => {
    // Stagger timestamps so "Mới nhất" sorting is deterministic.
    const at = new Date(base + index * 86_400_000).toISOString()
    insert.run(
      randomUUID(), t.slug, t.kind ?? "document", t.name, t.description ?? "", t.category,
      JSON.stringify(t.tags ?? []), JSON.stringify(t.content), buildSearchText({ ...t, description: t.description ?? "", tags: t.tags ?? [] }), at, at,
    )
  })
}

function resolveDbPath() {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH
  // Vercel functions only have a writable /tmp (ephemeral; fine for a demo deployment).
  return process.env.VERCEL ? "/tmp/presentation-templates.db" : path.join(process.cwd(), "data", "app.db")
}

export function openDatabase(file = resolveDbPath()): DatabaseSync {
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true })
  const db = new DatabaseSync(file)
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;")
  db.exec(SCHEMA)
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM templates").get() as { count: number }
  if (count === 0) seed(db)
  return db
}

const globalForDb = globalThis as unknown as { __ptlDb?: DatabaseSync }

/** Singleton connection (survives Next.js hot reloads in dev). */
export function getDb(): DatabaseSync {
  globalForDb.__ptlDb ??= openDatabase()
  return globalForDb.__ptlDb
}

/** Test helper: point the singleton at a fresh database. */
export function setDbForTesting(db: DatabaseSync) {
  globalForDb.__ptlDb = db
}
