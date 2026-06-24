const API_KEY = import.meta.env.VITE_KLIPY_API_KEY ?? ''
const BASE = `https://api.klipy.com/api/v1/${API_KEY}/gifs`

export interface KlipyGif {
  id: string
  title: string
  url: string
  preview_url: string
}

interface KlipyFileVariant {
  gif?: { url?: string; width?: number; height?: number; size?: number }
  webp?: { url?: string; width?: number; height?: number; size?: number }
  jpg?: { url?: string; width?: number; height?: number; size?: number }
  mp4?: { url?: string; width?: number; height?: number; size?: number }
}

interface KlipyItem {
  id: number | string
  title?: string
  slug?: string
  file?: {
    hd?: KlipyFileVariant
    md?: KlipyFileVariant
    sm?: KlipyFileVariant
  }
}

interface KlipyResponse {
  result: boolean
  data: {
    data: KlipyItem[]
  }
}

function extractUrls(item: KlipyItem): { url: string; preview: string } {
  const file = item.file ?? {}
  const full = file.hd?.gif?.url ?? file.md?.gif?.url ?? file.sm?.gif?.url ?? ''
  const preview = file.md?.gif?.url ?? file.sm?.gif?.url ?? full
  return { url: full, preview }
}

export async function searchGifs(query: string, page = 1, perPage = 20): Promise<KlipyGif[]> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    per_page: String(perPage),
    content_filter: 'high',
  })
  const res = await fetch(`${BASE}/search?${params}`)
  if (!res.ok) return []
  const json: KlipyResponse = await res.json()
  return (json.data?.data ?? []).map(item => {
    const { url, preview } = extractUrls(item)
    return { id: String(item.id), title: item.title ?? '', url, preview_url: preview }
  })
}

export async function trendingGifs(page = 1, perPage = 20): Promise<KlipyGif[]> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    content_filter: 'high',
  })
  const res = await fetch(`${BASE}/trending?${params}`)
  if (!res.ok) return []
  const json: KlipyResponse = await res.json()
  return (json.data?.data ?? []).map(item => {
    const { url, preview } = extractUrls(item)
    return { id: String(item.id), title: item.title ?? '', url, preview_url: preview }
  })
}
