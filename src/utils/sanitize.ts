const SAFE_PROTOCOLS = new Set(['https:', 'http:'])

export function sanitizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  try {
    const url = new URL(trimmed)
    if (!SAFE_PROTOCOLS.has(url.protocol)) return ''
  } catch {
    // Not an absolute URL — allow relative paths through as-is
  }

  return trimmed
}
