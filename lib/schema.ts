export const THEME_TAGS = [
    'high-contrast',
    'accessible',
    'creative',
    'modern',
    'high-readability',
    'corporate',
    'minimal',
] as const;

export type ThemeTag = (typeof THEME_TAGS)[number];

export type ThemePreviewMode = 'light' | 'dark';

export interface LocalizedString {
    en: string;
    ru: string;
}

export interface ThemeAuthor {
    name: string;
    url?: string;
}

/** Metadata shipped with each public catalog entry. */
export interface ThemeMetadata {
    id: string;
    name: string;
    author: ThemeAuthor;
    description: LocalizedString;
    tags: ThemeTag[];
    brandColor: string;
}

/** A single CSS-variable value. */
export interface ThemeValue {
    value: string;
    ref?: string;
}

export type ThemeModeValue = Partial<Record<ThemePreviewMode, ThemeValue>>;

/** CSS-variable values stored as common values or light/dark pairs in the Themer JSON format. */
export type ThemePayload = Record<string, ThemeValue | ThemeModeValue>;

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Russian letters for theme ids; anything else outside a-z0-9 becomes a separator.
const CYRILLIC_TO_LATIN: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
};

// Converts a theme name to a kebab-case catalog id.
export function toThemeId(name: string) {
    return name
        .toLowerCase()
        .replace(/[а-яё]/g, (letter) => CYRILLIC_TO_LATIN[letter] ?? '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export class ThemeMetadataValidationError extends Error {
    constructor(message: string) {
        super(`Invalid theme metadata: ${message}`);
        this.name = 'ThemeMetadataValidationError';
    }
}

function validateAuthor(id: string, value: unknown) {
    if (!value || typeof value !== 'object') {
        throw new ThemeMetadataValidationError(`[${id}] author must be an object`);
    }
    const author = value as Record<string, unknown>;
    if (typeof author.name !== 'string' || !author.name.trim()) {
        throw new ThemeMetadataValidationError(`[${id}] author.name must be a non-empty string`);
    }
    if (author.url !== undefined && typeof author.url !== 'string') {
        throw new ThemeMetadataValidationError(`[${id}] author.url must be a string when present`);
    }
}

function validateDescription(id: string, value: unknown) {
    if (!value || typeof value !== 'object') {
        throw new ThemeMetadataValidationError(`[${id}] description must be an object`);
    }
    const description = value as Record<string, unknown>;
    if (typeof description.en !== 'string' || !description.en.trim()) {
        throw new ThemeMetadataValidationError(`[${id}] description.en must be a non-empty string`);
    }
    if (typeof description.ru !== 'string' || !description.ru.trim()) {
        throw new ThemeMetadataValidationError(`[${id}] description.ru must be a non-empty string`);
    }
}

function validateTags(id: string, value: unknown) {
    if (!Array.isArray(value)) {
        throw new ThemeMetadataValidationError(`[${id}] tags must be an array`);
    }
    for (const tag of value) {
        if (!THEME_TAGS.includes(tag as ThemeTag)) {
            throw new ThemeMetadataValidationError(
                `[${id}] unknown tag "${String(tag)}", allowed: ${THEME_TAGS.join(', ')}`,
            );
        }
    }
}

export function validateThemeMetadata(value: unknown): asserts value is ThemeMetadata {
    if (!value || typeof value !== 'object') {
        throw new ThemeMetadataValidationError('value is not an object');
    }
    const v = value as Record<string, unknown>;

    if (typeof v.id !== 'string' || !KEBAB_CASE.test(v.id)) {
        throw new ThemeMetadataValidationError(`id must be kebab-case string, got ${String(v.id)}`);
    }
    const id = v.id;

    if (typeof v.name !== 'string' || !v.name.trim()) {
        throw new ThemeMetadataValidationError(`[${id}] name must be a non-empty string`);
    }
    // The id is a function of the name, so a free id means a free name.
    const expectedId = toThemeId(v.name);
    if (id !== expectedId) {
        throw new ThemeMetadataValidationError(
            `[${id}] id must be derived from name "${v.name}", expected "${expectedId}"`,
        );
    }

    validateAuthor(id, v.author);
    validateDescription(id, v.description);
    validateTags(id, v.tags);

    if (typeof v.brandColor !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(v.brandColor)) {
        throw new ThemeMetadataValidationError(`[${id}] brandColor must be a #RRGGBB hex string`);
    }
}
