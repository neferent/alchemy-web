import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { proxyKlipy } from './api/_klipy'

// Dev-only stand-in for the Vercel function in api/klipy.ts.
// Reads KLIPY_API_KEY from .env (no VITE_ prefix, so it is never bundled).
function klipyDevProxy(apiKey: string | undefined): Plugin {
  return {
    name: 'klipy-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/klipy', async (req, res) => {
        const url = new URL(req.url ?? '', 'http://localhost')
        const { status, body } = await proxyKlipy(apiKey, Object.fromEntries(url.searchParams))
        res.statusCode = status
        res.setHeader('Content-Type', 'application/json')
        res.end(body)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue(), klipyDevProxy(env.KLIPY_API_KEY)],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
  }
})
