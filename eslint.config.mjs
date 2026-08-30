import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // These effects intentionally hydrate browser-only/local state after mount.
    // Keep the exceptions narrow; the rule remains active everywhere else.
    files: [
      'components/admin-preview.tsx',
      'components/admin-studio.tsx',
      'components/member-modal.tsx',
      'components/match-center.tsx',
    ],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);
