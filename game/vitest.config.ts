import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'packages/*/src/**/*.test.ts',
      'apps/wiki-client/**/*.test.ts',
      'apps/server/src/**/*.test.ts',
    ],
    exclude: ['apps/server/src/**/*.integration.test.ts'],
  },
});
