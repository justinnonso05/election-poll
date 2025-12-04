import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginNext from '@next/eslint-plugin-next';
import { FlatCompat } from '@eslint/eslintrc';
import unusedImports from 'eslint-plugin-unused-imports';

// Create the FlatCompat instance
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  // FlatCompat to support Next.js recommended config
  ...compat.config({
    extends: ['next', 'next/core-web-vitals'],
  }),

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // React recommended rules
  pluginReact.configs.flat.recommended,

  // Globals for browser and node environments
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // Configure `eslint-plugin-unused-imports` for auto-fixing
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      // First, disable the base `no-unused-vars` rules, as `@typescript-eslint/no-unused-vars` will be used instead.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      // Then enable `unused-imports/no-unused-imports` to auto-fix and sort.
      'unused-imports/no-unused-imports': 'error',

      // Optional: Enable `unused-imports/no-unused-vars` to also warn about unused variables.
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
];
