// All requests go through our own /api/klipy proxy, which adds the API key server-side.
type Kind = 'gifs' | 'clips' | 'stickers'

function klipyUrl(kind: Kind, endpoint: 'search' | 'trending' | 'categories', params?: URLSearchParams): string {
  const qs = new URLSearchParams(params)
  qs.set('kind', kind)
  qs.set('endpoint', endpoint)
  return `/api/klipy?${qs}`
}

export interface KlipyGif {
  id: string
  title: string
  url: string
  preview_url: string
}

export interface KlipyClip {
  id: string
  title: string
  url: string
  preview_url: string
}

export interface KlipyCategory {
  id: string | number
  name: string
  slug: string
}

interface KlipyFileVariant {
  gif?: { url?: string; width?: number; height?: number; size?: number }
  webp?: { url?: string; width?: number; height?: number; size?: number }
  jpg?: { url?: string; width?: number; height?: number; size?: number }
  mp4?: { url?: string; width?: number; height?: number; size?: number }
}

interface KlipyGifItem {
  id: number | string
  title?: string
  slug?: string
  file?: {
    hd?: KlipyFileVariant
    md?: KlipyFileVariant
    sm?: KlipyFileVariant
  }
}

interface KlipyGifResponse {
  result: boolean
  data: { data: KlipyGifItem[] }
}

function extractGifUrls(item: KlipyGifItem): { url: string; preview: string } {
  const file = item.file ?? {}
  const full = file.hd?.gif?.url ?? file.md?.gif?.url ?? file.sm?.gif?.url ?? ''
  const preview = file.md?.gif?.url ?? file.sm?.gif?.url ?? full
  return { url: full, preview }
}

interface KlipyClipItem {
  id?: number | string
  title?: string
  slug?: string
  file?: { gif?: string; mp4?: string; webp?: string }
}

interface KlipyClipResponse {
  result: boolean
  data: { data: KlipyClipItem[] }
}

function extractClipUrls(item: KlipyClipItem): { url: string; preview: string } {
  const file = item.file ?? {}
  const full = file.gif ?? file.mp4 ?? file.webp ?? ''
  return { url: full, preview: full }
}

export async function searchGifs(query: string, page = 1, perPage = 20): Promise<KlipyGif[]> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    per_page: String(perPage),
    content_filter: 'high',
  })
  const res = await fetch(klipyUrl('gifs', 'search', params))
  if (!res.ok) return []
  const json: KlipyGifResponse = await res.json()
  return (json.data?.data ?? []).map(item => {
    const { url, preview } = extractGifUrls(item)
    return { id: String(item.id), title: item.title ?? '', url, preview_url: preview }
  })
}

export async function trendingGifs(page = 1, perPage = 20): Promise<KlipyGif[]> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    content_filter: 'high',
  })
  const res = await fetch(klipyUrl('gifs', 'trending', params))
  if (!res.ok) return []
  const json: KlipyGifResponse = await res.json()
  return (json.data?.data ?? []).map(item => {
    const { url, preview } = extractGifUrls(item)
    return { id: String(item.id), title: item.title ?? '', url, preview_url: preview }
  })
}

// ── Clips API ─────────────────────────────────────────────────────────────────

export async function searchClips(query: string, page = 1, perPage = 20): Promise<KlipyClip[]> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    per_page: String(perPage),
    content_filter: 'high',
  })
  const res = await fetch(klipyUrl('clips', 'search', params))
  if (!res.ok) return []
  const json: KlipyClipResponse = await res.json()
  return (json.data?.data ?? []).map(item => {
    const { url, preview } = extractClipUrls(item)
    return { id: String(item.slug ?? item.id ?? ''), title: item.title ?? '', url, preview_url: preview }
  })
}

export async function trendingClips(page = 1, perPage = 20): Promise<KlipyClip[]> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    content_filter: 'high',
  })
  const res = await fetch(klipyUrl('clips', 'trending', params))
  if (!res.ok) return []
  const json: KlipyClipResponse = await res.json()
  return (json.data?.data ?? []).map(item => {
    const { url, preview } = extractClipUrls(item)
    return { id: String(item.slug ?? item.id ?? ''), title: item.title ?? '', url, preview_url: preview }
  })
}

export async function clipCategories(): Promise<KlipyCategory[]> {
  const res = await fetch(klipyUrl('clips', 'categories'))
  if (!res.ok) return []
  const json = await res.json()
  const items: { category: string; query: string }[] = json.data?.categories ?? []
  return items.map((cat, i) => ({
    id: String(i),
    name: cat.category,
    slug: cat.query,
  }))
}

// ── Stickers API ─────────────────────────────────────────────────────────────

export interface KlipySticker {
  id: string
  title: string
  url: string
  preview_url: string
}

interface KlipyStickerResponse {
  result: boolean
  data: { data: KlipyGifItem[] }
}

export async function searchStickers(query: string, page = 1, perPage = 20): Promise<KlipySticker[]> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    per_page: String(perPage),
    content_filter: 'high',
  })
  const res = await fetch(klipyUrl('stickers', 'search', params))
  if (!res.ok) return []
  const json: KlipyStickerResponse = await res.json()
  return (json.data?.data ?? []).map(item => {
    const { url, preview } = extractGifUrls(item)
    return { id: String(item.slug ?? item.id ?? ''), title: item.title ?? '', url, preview_url: preview }
  })
}

export async function trendingStickers(page = 1, perPage = 20): Promise<KlipySticker[]> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    content_filter: 'high',
  })
  const res = await fetch(klipyUrl('stickers', 'trending', params))
  if (!res.ok) return []
  const json: KlipyStickerResponse = await res.json()
  return (json.data?.data ?? []).map(item => {
    const { url, preview } = extractGifUrls(item)
    return { id: String(item.slug ?? item.id ?? ''), title: item.title ?? '', url, preview_url: preview }
  })
}
