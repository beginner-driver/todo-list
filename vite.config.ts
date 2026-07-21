import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/3_todo-list/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
