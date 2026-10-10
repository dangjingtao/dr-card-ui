import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 本地联调：dev server 同源透传后端 API，浏览器直接打 5175 即可，无需改页面 base URL。
// 目标地址优先取 VITE_API_BASE_URL，未设置时回落到本地联调后端。
const DEV_API_TARGET = process.env.VITE_API_BASE_URL?.trim() || 'http://192.168.1.81:7002'

// OSS immutable artifacts are served from /h5/releases/<sha>/<run>/, not the site root.
// Use a relative Vite base only when packaging those artifacts; Cloudflare and local
// development continue to use the existing root-relative paths.
const ossArtifact = process.env.H5_OSS_ARTIFACT === '1'

export default defineConfig({
  base: ossArtifact ? './' : '/',
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
