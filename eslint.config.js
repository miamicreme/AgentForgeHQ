const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = [
  { ignores: ['eslint.config.js', 'scripts/**', '**/*.js'] },
  ...compat.config({
    extends: ['./packages/eslint-config'],
    env: { node: true },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }),
];
