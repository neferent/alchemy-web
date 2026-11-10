import { proxyKlipy } from './_klipy'

interface Req { query: Record<string, string | string[] | undefined> }
interface Res {
  status(code: number): Res
  setHeader(name: string, value: string): Res
  send(body: string): void
}

export default async function handler(req: Req, res: Res) {
  const query: Record<string, string | undefined> = {}
  for (const [k, v] of Object.entries(req.query)) query[k] = Array.isArray(v) ? v[0] : v

  const { status, body } = await proxyKlipy(process.env.KLIPY_API_KEY, query)
  res.setHeader('Content-Type', 'application/json')
  if (status === 200) res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
  res.status(status).send(body)
}
