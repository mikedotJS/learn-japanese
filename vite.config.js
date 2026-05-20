import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/learn-japanese/',
  test: {
    environment: 'jsdom',
    globals: true,
    // Unit tests live next to source. Playwright e2e specs in tests/ are
    // run via `npm run test:e2e` and must not be picked up by vitest.
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
