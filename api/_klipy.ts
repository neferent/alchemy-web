// Server-side KLIPY proxy logic, shared by the Vercel function (api/klipy.ts)
// and the Vite dev server (vite.config.ts). The API key never reaches the browser.

const KINDS = new Set(['gifs', 'clips', 'stickers'])
const ENDPOINTS = new Set(['search', 'trending', 'categories'])
const FORWARDED_PARAMS = ['q', 'page', 'per_page', 'content_filter']

export interface ProxyResult {
  status: number
  body: string
}

export async function proxyKlipy(
  apiKey: string | undefined,
  query: Record<string, string | undefined>,
): Promise<ProxyResult> {
  if (!apiKey) return { status: 503, body: JSON.stringify({ error: 'KLIPY_API_KEY is not configured' }) }

  const { kind, endpoint } = query
  if (!kind || !endpoint || !KINDS.has(kind) || !ENDPOINTS.has(endpoint)) {
    return { status: 400, body: JSON.stringify({ error: 'Invalid kind or endpoint' }) }
  }

  const params = new URLSearchParams()
  for (const name of FORWARDED_PARAMS) {
    const value = query[name]
    if (value !== undefined) params.set(name, value.slice(0, 200))
  }
  const perPage = Number(params.get('per_page'))
  if (perPage > 50) params.set('per_page', '50')

  const url = `https://api.klipy.com/api/v1/${encodeURIComponent(apiKey)}/${kind}/${endpoint}?${params}`
  try {
    const upstream = await fetch(url)
    return { status: upstream.status, body: await upstream.text() }
  } catch {
    return { status: 502, body: JSON.stringify({ error: 'Upstream request failed' }) }
  }
}
