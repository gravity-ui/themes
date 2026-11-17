import baseConfig from '@gravity-ui/eslint-config';
import clientConfig from '@gravity-ui/eslint-config/client';
import importOrderConfig from '@gravity-ui/eslint-config/import-order';
import prettierConfig from '@gravity-ui/eslint-config/prettier';
import {defineConfig} from 'eslint/config';
import globals from 'globals';

export default defineConfig([
    ...baseConfig,
    ...clientConfig,
    ...importOrderConfig,
    ...prettierConfig,
    {
        files: ['**/*.js', '**/*.mjs'],
        languageOptions: {globals: globals.node},
    },
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'renderer/.next/**',
            'renderer/next-env.d.ts',
            'output/**',
        ],
    },
]);
