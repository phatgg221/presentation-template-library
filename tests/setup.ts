import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { beforeEach } from "vitest"
import { openDatabase, setDbForTesting } from "@/lib/db"

process.env.STORAGE_DIR = mkdtempSync(path.join(tmpdir(), "otl-test-"))

// Every test gets a fresh, seeded in-memory database.
beforeEach(() => {
  setDbForTesting(openDatabase(":memory:"))
})
