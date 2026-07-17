const js = require('@eslint/js')

module.exports = [
  { ignores: ['**/dist/**', '**/.next/**', '**/coverage/**', '**/node_modules/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-constant-condition': 'error',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
    },
  },
]
