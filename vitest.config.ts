import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
    coverage: { include: ['src/**/*.ts'], reportsDirectory: './coverage' },
  },
});
