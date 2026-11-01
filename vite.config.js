import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''),
    'import.meta.env.VITE_GEMINI_IMAGE_API_KEY': JSON.stringify(process.env.GEMINI_IMAGE_API_KEY || process.env.VITE_GEMINI_IMAGE_API_KEY || '')
  }
})
