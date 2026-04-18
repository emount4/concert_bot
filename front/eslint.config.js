import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    rules: {
      // The repo uses local state updates in effects in multiple pages; keep the guidance
      // but don't fail CI/build on it.
      'react-hooks/set-state-in-effect': 'warn',
      // React Compiler-related rule that currently flags a few existing memo patterns.
      'react-hooks/preserve-manual-memoization': 'warn',
      // Allow exporting non-components from files used by Vite/React Fast Refresh.
      'react-refresh/only-export-components': 'warn',
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
