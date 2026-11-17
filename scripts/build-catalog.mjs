import {createHash} from 'node:crypto';
import {copyFile, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
/** @type {typeof import('../lib/index')} */
const {
    CATALOG_FORMAT_VERSION,
    CATALOG_MANIFEST_PATH,
    CATALOG_NAMES_PATH,
    CATALOG_PAGE_SIZE,
    getCatalogPagePath,
    getThemeMetadataPath,
    getThemePayloadPath,
    getThemePreviewPath,
} = require('../dist/index.js');
/** @type {typeof import('../lib/schema')} */
const {THEME_TAGS, validateThemeMetadata} = require('../dist/schema.js');
/** @type {typeof import('../lib/validation')} */
const {validateThemePayload} = require('../dist/validation.js');

/** @typedef {import('../lib/schema').ThemeMetadata} ThemeMetadata */
/** @typedef {import('../lib/schema').ThemeTag} ThemeTag */

const OUT_DIR = 'dist/catalog';
const MODES = /** @type {const} */ (['light', 'dark']);

/** @type {ThemeMetadata[]} */
const themes = [];
/** Catalog path to serialized JSON. */
/** @type {Map<string, string>} */
const jsonFiles = new Map();
/** Catalog path to source PNG; copied as is, never inlined. */
/** @type {Map<string, string>} */
const previewFiles = new Map();
/**
 * @param {string} file
 * @param {unknown} value
 */
const addJson = (file, value) => {
    jsonFiles.set(file, JSON.stringify(value));
};

const names = new Map();
for (const file of (await readdir('themes')).filter((name) => name.endsWith('.meta.json')).sort()) {
    try {
        const metadata = JSON.parse(await readFile(`themes/${file}`, 'utf8'));
        // The editor hint is not part of the published metadata.
        delete metadata.$schema;
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
        addJson(getThemeMetadataPath(metadata.id), metadata);
        addJson(getThemePayloadPath(metadata.id), payload);
        for (const mode of MODES) {
            previewFiles.set(
                getThemePreviewPath(metadata.id, mode),
                `previews/${metadata.id}-${mode}.png`,
            );
        }
        themes.push(metadata);
    } catch (error) {
        throw new Error(
            `themes/${file}: ${error instanceof Error ? error.message : String(error)}`,
            {cause: error},
        );
    }
}

/**
 * Writes the pages of one listing.
 * @param {ThemeMetadata[]} list
 * @param {ThemeTag} [tag]
 * @returns {import('../lib/index').CatalogListing}
 */
const addPages = (list, tag) => {
    const pageCount = Math.ceil(list.length / CATALOG_PAGE_SIZE);
    for (let page = 1; page <= pageCount; page++) {
        addJson(
            getCatalogPagePath(page, tag),
            list.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE),
        );
    }
    return {themeCount: list.length, pageCount};
};

addJson(
    CATALOG_NAMES_PATH,
    themes.map(({id, name}) => ({id, name})),
);
const listing = addPages(themes);
const tags = Object.fromEntries(
    THEME_TAGS.map((tag) => [
        tag,
        addPages(
            themes.filter((theme) => theme.tags.includes(tag)),
            tag,
        ),
    ]),
);

// One hash over every file lets consumers serve a catalog copy under an immutable URL.
const hash = createHash('sha256');
for (const file of [...jsonFiles.keys(), ...previewFiles.keys()].sort()) {
    const source = previewFiles.get(file);
    const content = source ? await readFile(source) : (jsonFiles.get(file) ?? '');
    hash.update(`${file}\0${content.length}\0`).update(content);
}
addJson(CATALOG_MANIFEST_PATH, {
    formatVersion: CATALOG_FORMAT_VERSION,
    hash: hash.digest('hex'),
    pageSize: CATALOG_PAGE_SIZE,
    ...listing,
    tags,
});

await rm(OUT_DIR, {recursive: true, force: true});
/**
 * Creates the directory for a catalog file.
 * @param {string} file
 * @returns {Promise<string>}
 */
const prepare = async (file) => {
    const target = path.join(OUT_DIR, file);
    await mkdir(path.dirname(target), {recursive: true});
    return target;
};
for (const [file, content] of jsonFiles) {
    await writeFile(await prepare(file), content);
}
for (const [file, source] of previewFiles) {
    await copyFile(source, await prepare(file));
}
