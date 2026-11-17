import type {ThemeMetadata, ThemePayload} from './schema';

// Canonical text of the source files in `themes/`. The catalog build rejects
// any file that differs from this output, so every writer must use these.

// Editor hint written first into every `themes/<id>.meta.json`.
const THEME_METADATA_SCHEMA_HINT = './meta.schema.json';

const formatJsonFile = (value: unknown) => JSON.stringify(value, null, 4) + '\n';

/** Text of `themes/<id>.meta.json`; key order of `metadata` is kept. */
export const formatThemeMetadataFile = (metadata: ThemeMetadata) =>
    formatJsonFile({$schema: THEME_METADATA_SCHEMA_HINT, ...metadata});

/** Text of `themes/<id>.theme.json`; key order of `payload` is kept. */
export const formatThemePayloadFile = (payload: ThemePayload) => formatJsonFile(payload);
