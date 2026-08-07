import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  // 注意：@ffmpeg/core（单线程版）通过 Web Worker 运行，不需要 SharedArrayBuffer，
  // 因此无需 COOP/COEP 跨源隔离头。配置 COEP 反而会阻断从 CDN 加载 ffmpeg 核心。
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths()
  ],
})
