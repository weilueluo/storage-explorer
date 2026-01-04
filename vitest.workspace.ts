import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/storage',
  'packages/shared',
  'packages/dev-utils',
  'packages/test-utils',
  'pages/popup',
]);
