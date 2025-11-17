import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat();

export default [
  js.configs.recommended,
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
];