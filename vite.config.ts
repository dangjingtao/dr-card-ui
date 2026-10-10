import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 本地联调：dev server 同源透传后端 API，浏览器直接打 5175 即可，无需改页面 base URL。
// 目标地址优先取 VITE_API_BASE_URL，未设置时回落到本地联调后端。
const DEV_API_TARGET = process.env.VITE_API_BASE_URL?.trim() || 'http://192.168.1.81:7002'

// Legacy immutable OSS releases need a relative base. Stable kbs-web roots
// instead require an absolute prefix, so deep-link refreshes load JS/CSS from
// the same environment (not from a nested route's /assets directory).
// Cloudflare and local dev keep '/'.
const ossArtifact = process.env.H5_OSS_ARTIFACT === '1'
const fixedWebBases: Record<string, string> = {
  ui: '/kbs-web/ui/',
  dev: '/kbs-web/dev/',
  test: '/kbs-web/test/',
  prod: '/kbs-web/prod/last/',
}
const fixedBase = fixedWebBases[process.env.OSS_WEB_TARGET?.trim() || '']

export default defineConfig({
  base: ossArtifact && fixedBase ? fixedBase : ossArtifact ? './' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: DEV_API_TARGET,
        changeOrigin: true,
      },
    },
  },
})
