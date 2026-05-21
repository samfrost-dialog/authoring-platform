import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
  ]),
  {
    rules: {
      // Allow unused vars prefixed with _ (common for destructuring)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Prefer const
      'prefer-const': 'error',
      // No console in production code (warn only so devs can still debug)
      'no-console': 'warn',
    },
  },
])

export default eslintConfig
