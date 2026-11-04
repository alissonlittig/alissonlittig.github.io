/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' + HashRouter: the build works from any subfolder (projetos/<slug>/app/)
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', globals: true },
})
