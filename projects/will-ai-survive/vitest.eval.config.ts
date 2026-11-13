import { existsSync } from 'fs'
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

const ENV_FILE = '.env.local'
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE)

export default defineConfig({
  test: {
    include: ['evals/**/*.eval.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
