import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@src': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/storage.ts',
        'src/bookmark-utils.ts',
        'src/Header.tsx',
        'src/TreeNode.tsx',
        'src/TreeViewer.tsx',
        'src/TreeExplorer.tsx',
      ],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/test/**'],
      thresholds: {
        lines: 70,
        branches: 70,
        functions: 70,
        statements: 70,
      },
    },
  },
});
