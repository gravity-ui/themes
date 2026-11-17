import {createHash} from 'node:crypto';
import {copyFile, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
/** @type {typeof import('../lib/files')} */
const {formatThemeMetadataFile, formatThemePayloadFile} = require('../dist/files.js');
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

/**
 * Rejects a source file whose text is not the canonical output for its content.
 * @param {string} subject
 * @param {string} text
 * @param {string} expected
 * @param {string} formatter
 */
const assertCanonicalFile = (subject, text, expected, formatter) => {
    if (text !== expected) {
        throw new Error(
            `${subject} is not in the canonical format; write it with ${formatter} ` +
                'from @gravity-ui/themes/files: 4-space JSON, "$schema" first in metadata, trailing newline',
        );
    }
};

const names = new Map();
// Listings follow the order of ids; sorting file names would put `a-b.meta.json` before `a.meta.json`.
const themeIds = (await readdir('themes'))
    .filter((name) => name.endsWith('.meta.json'))
    .map((name) => name.slice(0, -'.meta.json'.length))
    .sort();
for (const expectedId of themeIds) {
    const file = `${expectedId}.meta.json`;
    try {
        const metadataText = await readFile(`themes/${file}`, 'utf8');
        const metadata = JSON.parse(metadataText);
        // The editor hint is not part of the published metadata.
        delete metadata.$schema;
        validateThemeMetadata(metadata);
        assertCanonicalFile(
            'metadata file',
            metadataText,
            formatThemeMetadataFile(metadata),
            'formatThemeMetadataFile',
        );
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
        const payloadFile = `themes/${metadata.id}.theme.json`;
        const payloadText = await readFile(payloadFile, 'utf8');
        const sourcePayload = JSON.parse(payloadText);
        assertCanonicalFile(
            payloadFile,
            payloadText,
            formatThemePayloadFile(sourcePayload),
            'formatThemePayloadFile',
        );
        const payload = validateThemePayload(sourcePayload);
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
