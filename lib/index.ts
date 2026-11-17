import type {ThemeMetadata, ThemePreviewMode, ThemeTag} from './schema';

/** Themes per metadata page, for the full listing and for every tag. */
export const CATALOG_PAGE_SIZE = 50;

/** Bumped when the file layout below changes incompatibly. */
export const CATALOG_FORMAT_VERSION = 1;

export interface CatalogListing {
    themeCount: number;
    pageCount: number;
}

/** `catalog/manifest.json`: listing sizes; its size depends on the tag list only. */
export interface CatalogManifest extends CatalogListing {
    formatVersion: typeof CATALOG_FORMAT_VERSION;
    /** SHA-256 of every other catalog file, for cache-busting copies of the catalog. */
    hash: string;
    pageSize: number;
    tags: Record<ThemeTag, CatalogListing>;
}

/** `catalog/names.json`: every theme id and name, for checking that a new name is free. */
export type CatalogNames = Pick<ThemeMetadata, 'id' | 'name'>[];

/** `catalog/pages/<n>.json` and `catalog/tags/<tag>/<n>.json`: one page of metadata. */
export type CatalogPage = ThemeMetadata[];

// Paths are relative to the `catalog/` directory of the package. Pages are numbered from 1.
export const CATALOG_MANIFEST_PATH = 'manifest.json';
export const CATALOG_NAMES_PATH = 'names.json';

export const getCatalogPagePath = (page: number, tag?: ThemeTag) =>
    tag ? `tags/${tag}/${page}.json` : `pages/${page}.json`;

export const getThemeMetadataPath = (id: string) => `metadata/${id}.json`;

export const getThemePayloadPath = (id: string) => `payloads/${id}.json`;

export const getThemePreviewPath = (id: string, mode: ThemePreviewMode) =>
    `previews/${id}-${mode}.png`;
