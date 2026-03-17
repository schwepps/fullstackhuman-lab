import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts'],
      exclude: ['**/*.d.ts', '**/types/**'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      // Allow tests to import server-only modules without throwing
      'server-only': resolve(__dirname, 'tests/__mocks__/server-only.ts'),
    },
  },
})
