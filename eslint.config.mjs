// @ts-check
import eslint from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['src/generated/**'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'common', pattern: 'src/common/**/*' },
        { type: 'config', pattern: 'src/config/**/*' },
        { type: 'prisma', pattern: 'src/modules/prisma/**/*' },
        { type: 'user', pattern: 'src/modules/user/**/*' },
        { type: 'auth', pattern: 'src/modules/auth/**/*' },
        { type: 'health', pattern: 'src/modules/health/**/*' },
      ],
      'boundaries/ignore': [
        'src/main.ts',
        'src/app.module.ts',
        'src/**/*.spec.ts',
        'src/**/*.integration.spec.ts',
      ],
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: { type: 'common' },
              disallow: {
                to: { type: ['auth', 'user', 'prisma', 'health'] },
              },
            },
            {
              from: { type: 'config' },
              disallow: {
                to: { type: ['auth', 'user', 'prisma', 'health'] },
              },
            },
            { from: { type: 'user' }, disallow: { to: { type: 'auth' } } },
            {
              from: { type: 'prisma' },
              disallow: { to: { type: ['auth', 'user'] } },
            },
            {
              from: { type: 'health' },
              disallow: { to: { type: ['auth', 'user'] } },
            },
          ],
        },
      ],
    },
  },
);
