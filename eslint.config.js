// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';

import eslintPluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintPluginA11y from 'eslint-plugin-jsx-a11y';

// Correct way to import eslint-plugin-import for flat config:
import eslintPluginImport from 'eslint-plugin-import'; // This is the plugin itself

// Correct way to import typescript-eslint for flat config:
import tseslint from 'typescript-eslint'; // This provides the parser and plugin

// Prettier integration
import eslintPluginPrettier from 'eslint-plugin-prettier';
// eslint-config-prettier is not a plugin/rule set to import directly in flat config's plugins or rules.
// It's effectively applied by just being extended last in the extends array.
// So, we don't need to import `eslintConfigPrettier` directly here.
// Instead, we just ensure its rules are implicitly applied by `prettier/prettier` being last.

import { defineConfig, globalIgnores } from 'eslint/config'; // Correct import for eslint/config

export default defineConfig([
  globalIgnores(['dist', 'build', 'node_modules', '.webpack', 'release']),

  // Configuration for JavaScript files (.js, .jsx)
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: eslintPluginReact,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': eslintPluginA11y,
      import: eslintPluginImport, // Register the import plugin
      prettier: eslintPluginPrettier, // Prettier plugin
    },
    rules: {
      ...js.configs.recommended.rules,
      ...eslintPluginReact.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.vite.rules,
      ...eslintPluginA11y.configs.recommended.rules,
      ...eslintPluginImport.configs.recommended.rules, // Apply import rules

      // Prettier rules (must be last to override)
      // We don't spread eslintConfigPrettier.rules directly in flat config;
      // 'prettier/prettier' rule handles the integration.
      'prettier/prettier': 'error',

      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        node: true,
      },
    },
  },

  // Configuration for TypeScript files (.ts, .tsx)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: eslintPluginReact,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': eslintPluginA11y,
      import: eslintPluginImport,
      '@typescript-eslint': tseslint.plugin,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs.stylistic.rules,
      ...eslintPluginReact.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.vite.rules,
      ...eslintPluginA11y.configs.recommended.rules,
      ...eslintPluginImport.configs.recommended.rules,

      'prettier/prettier': 'error',

      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^[A-Z_]' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },

  // Specific Configuration for Electron Main Process Files
  {
    files: ['electron/**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.electron,
      },
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: eslintPluginImport,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs.stylistic.rules,
      ...eslintPluginImport.configs.recommended.rules,

      'prettier/prettier': 'error',

      'no-console': 'off',
      'no-restricted-globals': ['error', 'window', 'document', 'navigator'],
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
]);
