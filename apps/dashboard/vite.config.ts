import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // regex keys so '/doc' (API docs) doesn't swallow '/doctors' (SPA route)
      '^/v1': 'http://localhost:3000',
      '^/doc$': 'http://localhost:3000',
      '^/doc/': 'http://localhost:3000',
      '^/swagger$': 'http://localhost:3000',
      '^/swagger/': 'http://localhost:3000',
    },
  },
})
