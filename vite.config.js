import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.', // Ensure vite uses correct root
  server: {
    port: 3000,
    host: true, // untuk akses dari VR headset di network yang sama
  },
})
