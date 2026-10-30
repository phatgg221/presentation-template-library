import "server-only"
import { deckToPptx } from "./exporters/pptx"
import { templatesRepo } from "./repositories/templates"
import type { Template } from "./repositories/types"
import { getFile, putFile } from "./storage"

/**
 * Returns the template's original .pptx: rendered once from the template content and stored, so
 * every later download returns identical bytes (a .pptx embeds timestamps, so re-rendering would
 * not). A content update bumps the version and clears the path, producing a new original.
 * Nothing here ever modifies an existing original.
 */
export async function getTemplateOriginalFile(template: Template): Promise<Buffer> {
  const key = templatesRepo.filePath(template.id)
  const stored = key ? await getFile(key) : null
  if (stored) return stored
  const generated = await deckToPptx(template.content, { title: template.name })
  const newKey = `templates/${template.id}/v${template.version}.pptx`
  await putFile(newKey, generated)
  const finalKey = templatesRepo.attachFileIfMissing(template.id, newKey)
  return finalKey === newKey ? generated : ((await getFile(finalKey)) ?? generated)
}
