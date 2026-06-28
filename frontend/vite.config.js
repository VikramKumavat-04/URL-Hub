import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Remove console.log in production
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // manualChunks: {
        //   vendor: ['react', 'react-dom'],
        //   router: ['@tanstack/react-router'],
        //   redux: ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
        // },
      },
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
