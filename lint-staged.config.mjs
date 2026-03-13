export default {
  'projects/turing-game/**/*.{ts,tsx,mjs}': (files) => [
    `pnpm --filter turing-game exec eslint --fix ${files.join(' ')}`,
  ],
  '*.{ts,tsx,mjs,json,md,css}': ['prettier --write'],
}
