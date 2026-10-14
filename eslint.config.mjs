import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      curly: ['error', 'all'],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // root-level config files are not part of the TS project — disable type-checked rules
    files: ['*.mjs', 'prisma.config.ts'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'prisma/**'],
  },
);
