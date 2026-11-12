import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Gemini klíče se do bundlu NEVKLÁDAJÍ. Volání jde přes serverové funkce /api/gemini/* (viz api/).
export default defineConfig({
  plugins: [react()],
  base: '/',
  // Žádný VITE_* nesmí do bundlu (VITE_GEMINI_API_KEY ve Vercel env) – vlastní prefix bez proměnných
  envPrefix: 'EM_PUBLIC_'
})
