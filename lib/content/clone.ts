/** Deep copy so a document never shares object references with its source template. */
export function cloneContent<T>(content: T): T {
  return structuredClone(content)
}
