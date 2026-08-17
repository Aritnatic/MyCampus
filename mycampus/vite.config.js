import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/MyCampus/',
  server: {
    port: 5173,
    open: true
  }
})
// trigger deploy 
