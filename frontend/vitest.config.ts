import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    // Modern test file discovery - co-located tests
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
    ],
          coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/**',
          'dist/**',
          'build/**',
          '**/*.d.ts',
          'src/client/**', // Auto-generated API client
          'src/vite-env.d.ts',
          'src/test-setup.ts',
          'src/**/*.{test,spec}.{ts,tsx}', // Exclude test files from coverage
          '**/*.config.{js,ts}',
          'public/**',
        ],
      },
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') }
    ],
  },
}) 