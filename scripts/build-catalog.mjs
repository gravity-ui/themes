import {mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
/** @type {typeof import('../lib/schema')} */
const {validateThemeMetadata} = require('../dist/schema.js');
/** @type {typeof import('../lib/validation')} */
const {validateThemePayload} = require('../dist/validation.js');
const themes = [];
const names = new Map();
for (const file of (await readdir('themes')).filter((name) => name.endsWith('.meta.json')).sort()) {
    try {
        const metadata = JSON.parse(await readFile(`themes/${file}`, 'utf8'));
        validateThemeMetadata(metadata);
        const expectedId = file.slice(0, -'.meta.json'.length);
        if (metadata.id !== expectedId) {
            throw new Error(`id "${metadata.id}" must match file name "${expectedId}"`);
        }
        const name = metadata.name.trim().toLowerCase();
        if (names.has(name)) {
            throw new Error(
                `Duplicate theme name "${metadata.name}"; first declared in themes/${names.get(name)}`,
            );
        }
        names.set(name, file);
        const payload = validateThemePayload(
            JSON.parse(await readFile(`themes/${metadata.id}.theme.json`, 'utf8')),
        );
        const previews = {light: '', dark: ''};
        for (const mode of /** @type {const} */ (['light', 'dark']))
            previews[mode] =
                'data:image/png;base64,' +
                (await readFile(`previews/${metadata.id}-${mode}.png`)).toString('base64');
        themes.push({metadata, payload, previews});
    } catch (error) {
        throw new Error(
            `themes/${file}: ${error instanceof Error ? error.message : String(error)}`,
            {cause: error},
        );
    }
}
await mkdir('dist', {recursive: true});
await writeFile('dist/catalog.json', JSON.stringify(themes));
await writeFile(
    'dist/catalog.d.ts',
    "import type {ThemeMetadata, ThemePayload} from './schema';\ndeclare const catalog: {metadata: ThemeMetadata; payload: ThemePayload; previews: Record<'light' | 'dark', string>}[];\nexport = catalog;\n",
);
