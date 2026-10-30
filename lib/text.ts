/** Lowercase + strip Vietnamese diacritics so "hop dong" matches "Hợp đồng". */
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

/** Safe ASCII-ish filename for Content-Disposition (plus RFC 5987 UTF-8 variant). */
export function contentDisposition(title: string, ext: string): string {
  const base = title.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) || "tai-lieu"
  const ascii = normalizeSearch(base).replace(/[^a-z0-9 _-]/g, "").replace(/\s+/g, "-") || "tai-lieu"
  return `attachment; filename="${ascii}.${ext}"; filename*=UTF-8''${encodeURIComponent(base)}.${ext}`
}

export function slugify(value: string): string {
  return normalizeSearch(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80)
}
