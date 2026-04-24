// vite.config.js
// This tells Vite to use Tailwind as a plugin
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),  // Add Tailwind here
  ],
})
