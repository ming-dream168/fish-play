import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // 多个 dev server 并行时各用各的依赖缓存, 避免互相覆盖
  cacheDir: process.env.VITE_CACHE_DIR ?? 'node_modules/.vite',
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 4000,
  },
  server: { host: '127.0.0.1', port: 5173 },
});
