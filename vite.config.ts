import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const fixedUiOss = process.env.H5_OSS_ARTIFACT === '1' && process.env.OSS_WEB_TARGET === 'ui'

export default defineConfig({
  base: fixedUiOss ? '/kbs-web/ui/' : '/',
  plugins: [react()],
})
