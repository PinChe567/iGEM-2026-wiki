import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: {
    host: '127.0.0.1',
    port: 5180,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: false,
      },
      '/health': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: false,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:8787',
        ws: true,
        changeOrigin: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
