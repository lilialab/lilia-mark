// @ts-check
const eslint = require('@eslint/js');
const { defineConfig, globalIgnores } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');
const eslintPluginUnicorn = require('eslint-plugin-unicorn').default;
const simpleImportSort = require('eslint-plugin-simple-import-sort');

module.exports = defineConfig([
  globalIgnores([
    'dist/**',
    'out-tsc/**',
    'src-tauri/**',
    'node_modules/**',
    '.angular/**',
    '.scratch/**',
  ]),
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    plugins: {
      unicorn: eslintPluginUnicorn,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      /* 外部包 → @/ → 相对路径；组间空行 */
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'],
            ['^node:'],
            ['^@?\\w'],
            ['^@/'],
            ['^\\.'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],

      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/array-type': ['error', { default: 'array' }],

      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'off',
      eqeqeq: 'error',
      'no-self-compare': 'error',
      'no-dupe-keys': 'error',

      'no-restricted-syntax': [
        'error',
        {
          selector: 'ForInStatement',
          message:
            '避免 for...in；可用 Object.keys/entries/values + 数组方法，或 for...of（可读性优先）。',
        },
      ],

      'unicorn/no-array-sort': ['error', { allowExpressionStatement: false }],
      'unicorn/no-array-reverse': ['error', { allowExpressionStatement: false }],
      'unicorn/no-array-splice': 'error',
      'unicorn/no-confusing-array-splice': 'error',
      'unicorn/prefer-at': 'error',
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
  eslintConfigPrettier,
]);
