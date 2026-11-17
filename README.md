# Gravity UI Themes

A public catalog of [Gravity UI](https://gravity-ui.com) themes with metadata, validated Themer JSON and light/dark previews. The package also provides shared submission validation, import normalization and a built-in font registry.

## Installation

```sh
npm install @gravity-ui/themes
```

## Usage

### Apply a theme

Import the CSS of a theme after the UIKit styles. The id of a theme is its file name in `themes/`, for example `coffee`.

```ts
import '@gravity-ui/uikit/styles/styles.css';
import '@gravity-ui/themes/css/coffee.css';
```

The file sets `--g-*` variables on `.g-root`, `.g-root_theme_light` and `.g-root_theme_dark`, so it works with the `ThemeProvider` theme switch. Gallery themes use only the built-in fonts listed in `@gravity-ui/themes/fonts`; load them in the app as you do for the default theme.

### Catalog

The catalog is a directory of small static files, `@gravity-ui/themes/catalog/*`, meant to be served as is and fetched on demand. No file except `names.json` grows with the number of themes, so a page that shows one theme or one page of the gallery downloads only that.

| File                       | Contents                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `manifest.json`            | Format version, content hash, page size, theme and page counts in total and by tag |
| `names.json`               | `{id, name}` of every theme, for checking that a new name is free                  |
| `pages/<n>.json`           | Metadata of up to 50 themes, pages numbered from 1                                 |
| `tags/<tag>/<n>.json`      | The same pages for the themes with one tag                                         |
| `metadata/<id>.json`       | Metadata of one theme                                                              |
| `payloads/<id>.json`       | Validated Themer JSON of one theme                                                 |
| `previews/<id>-<mode>.png` | Light or dark preview PNG, 740 by 500 pixels                                       |
| `css/<id>.css`             | The theme as UIKit CSS variables, the same as CSS export in the Themer             |

Themes keep the order of their ids in every listing. The manifest `hash` covers every other file, so a copy of the directory can be served under an immutable, hash-named URL. The root entry point exports the paths above and their types; resolve the directory with `require.resolve('@gravity-ui/themes/catalog/manifest.json')` to copy it into your static assets.

```ts
import {getCatalogPagePath, getThemePayloadPath, getThemePreviewPath} from '@gravity-ui/themes';
import type {CatalogPage} from '@gravity-ui/themes';
import type {ThemePayload} from '@gravity-ui/themes/schema';

// Wherever the copied `catalog/` directory is served from.
const base = '/static/themes';

const page: CatalogPage = await (await fetch(`${base}/${getCatalogPagePath(1)}`)).json();
const payload: ThemePayload = await (
  await fetch(`${base}/${getThemePayloadPath('coffee')}`)
).json();
const color = payload['--g-color-base-brand'];
const lightBrand = 'value' in color ? color.value : color.light.value;
const preview = `${base}/${getThemePreviewPath('coffee', 'light')}`;
// Use preview as an image src and lightBrand as the brand color.
```

TypeScript consumers should use `moduleResolution: "node16"`, `"nodenext"` or `"bundler"` to resolve the exported subpaths.

A payload entry is either `{value: string, ref?: string}` or a per-mode object with both `light` and `dark` leaves. Narrow with `'value' in entry` before reading a common value. `validateThemePayload` rejects incomplete mode pairs, so a validated payload can be passed to the pinned Themer `parseJSON` as is.

### Public entry points

| Import                                  | Contents                                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `@gravity-ui/themes`                    | Catalog file paths, page size and file types                                                   |
| `@gravity-ui/themes/schema`             | Metadata/payload types, tags, id generation and metadata validation                            |
| `@gravity-ui/themes/validation`         | `buildThemeMetadata`, `validateThemePayload` and validation errors                             |
| `@gravity-ui/themes/normalize-imported` | `normalizeImportedTheme`, which updates a parsed theme in place and returns it                 |
| `@gravity-ui/themes/draft`              | Submission draft types, text cleanup and field validation                                      |
| `@gravity-ui/themes/fonts`              | `DEFAULT_FONT_FAMILIES`, `BUILT_IN_FONTS` and `isBuiltInFontFamily`                            |
| `@gravity-ui/themes/files`              | `formatThemeMetadataFile` and `formatThemePayloadFile`, the canonical text of `themes/*` files |
| `@gravity-ui/themes/catalog/*`          | Catalog files described above                                                                  |
| `@gravity-ui/themes/css/*`              | `<id>.css`, the theme as UIKit CSS variables                                                   |

Use these entry points instead of importing implementation files from `dist/`.

## Development

Use Node.js 24 and npm 11 or newer. `.nvmrc` selects the development Node major.

```sh
npm ci
npm test
npm run render:build
```

`npm ci` installs dependencies and builds the library/catalog through `prepare`. Keep this lifecycle so Git dependencies also receive `dist/` until consumers migrate to an npm version. The render workflow reuses that build; `npm test` deliberately rebuilds to validate any source changes made since installation before running typecheck (library, renderer and scripts), ESLint, Stylelint and Prettier. The script typecheck resolves the generated library declarations from `dist/`. It is a package-check command, not a unit-test suite. `npm run build` can also be used independently to produce `dist/`. CI runs `npm test` and the renderer build on pull requests and pushes to `main`.

## Contributing

### Add a theme

1. Export JSON from [Themer](https://gravity-ui.com/themer).
2. Choose a unique theme name. Its id is derived from the name: lowercase, Cyrillic transliterated to Latin, every other run of non-alphanumeric characters replaced with `-` (`toThemeId` in `@gravity-ui/themes/schema`; `Retro Wave Radio` becomes `retro-wave-radio`). Add `themes/<id>.theme.json` and `themes/<id>.meta.json`. The metadata `id` must equal the file name without `.meta.json`. Both files must be byte-equal to the output of `formatThemeMetadataFile` and `formatThemePayloadFile` from `@gravity-ui/themes/files` for their parsed content: 4-space JSON with a trailing newline, metadata starting with `"$schema": "./meta.schema.json"`. The catalog build rejects any other formatting, and Prettier does not touch these files.
3. Fill metadata according to [`themes/meta.schema.json`](themes/meta.schema.json): name, author, English/Russian descriptions, tags and `#RRGGBB` brand color. Names must be unique after trimming and case normalization, and their ids must be unique too.
4. Add `previews/<id>-light.png` and `previews/<id>-dark.png`, both 740 by 500 pixels. Generate them with the pinned renderer below; do not substitute images from an unrelated renderer revision.
5. Run `npm test`, `npm run render:build` and `npm pack --dry-run`. Submit a pull request with a Conventional Commit title, such as `feat(themes): add a new theme`.

The catalog build validates metadata and payloads and writes the files above to `dist/catalog/`, previews included as separate PNGs. Source PNGs in `previews/` are not duplicated in the npm package. Font licenses in `licenses/` are included in the package.

### Generate or update previews

After `npm ci`, run `npm run render:build`, install the pinned Chromium with `npx playwright install --with-deps chromium`, then run `npm run render:start` in a separate terminal. The renderer listens at `http://127.0.0.1:3010`.

`npm run render:submission` reads these environment variables, using the same protocol as the render workflow:

| Variable            | Value                                                                      |
| ------------------- | -------------------------------------------------------------------------- |
| `SUBMISSION`        | Raw-deflate compressed UTF-8 JSON `{metadata, payload}`, encoded as base64 |
| `JOB_ID`            | A 36-character lowercase hexadecimal/hyphen correlation id                 |
| `USER_ID`           | A positive safe-integer GitHub account id                                  |
| `THEME_HASH`        | SHA-256 of `JSON.stringify({metadata, payload})` after payload validation  |
| `RENDERER_REVISION` | The full 40-character renderer commit SHA                                  |
| `GITHUB_SHA`        | The same commit SHA                                                        |
| `GITHUB_RUN_ID`     | The numeric run id                                                         |

For a local regeneration, construct the environment from the source files and run the same script (replace `coffee` with your id):

```sh
node --input-type=module <<'JS'
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {deflateRawSync} from 'node:zlib';

const require = createRequire(import.meta.url);
const {validateThemePayload} = require('./dist/validation.js');
const id = 'coffee';
const metadata = JSON.parse(readFileSync(`themes/${id}.meta.json`, 'utf8'));
// The editor hint is not part of the metadata.
delete metadata.$schema;
const payload = validateThemePayload(JSON.parse(readFileSync(`themes/${id}.theme.json`, 'utf8')));
const canonical = JSON.stringify({metadata, payload});
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
execFileSync(process.execPath, ['scripts/render-submission.mjs'], {
    stdio: 'inherit',
    env: {
        ...process.env,
        SUBMISSION: deflateRawSync(Buffer.from(canonical)).toString('base64'),
        JOB_ID: '00000000-0000-0000-0000-000000000000',
        USER_ID: '1',
        THEME_HASH: createHash('sha256').update(canonical).digest('hex'),
        RENDERER_REVISION: revision,
        GITHUB_SHA: revision,
        GITHUB_RUN_ID: '0',
    },
});
const result = JSON.parse(readFileSync('output/result.json', 'utf8'));
for (const mode of ['light', 'dark']) {
    writeFileSync(`previews/${id}-${mode}.png`, Buffer.from(result.files[mode], 'base64'));
}
JS
```

The six font families are pinned `@fontsource` dependencies, served locally by the renderer. The browser viewport is 740 by 375 at DPR 2; the capture root is 555 by 375, resized to a 740 by 500 PNG. Keep these dimensions and the pinned dependencies unchanged when regenerating comparable previews.

## Trusted renderer workflow

[`render-submission.yml`](.github/workflows/render-submission.yml) is dispatched at an immutable protected renderer tag. Set repository variable `TRUSTED_RENDERER_REVISION` to the tag's full reviewed commit SHA. The `revision` input, `github.sha` and this allowlist must match before checkout. The workflow never checks out contributor refs or fetches submitted URLs. Workflow inputs are passed through environment variables, never interpolated as shell source.

Dispatch inputs are `job_id`, `revision`, `theme_hash`, `user_id` and `submission`, corresponding to the variables above. A dispatcher needs Actions write and Contents read access to this repository. Credentials for dispatch stay with the dispatcher, not in theme data or workflow inputs.

The complete serialized workflow-dispatch input body must fit GitHub's 65,535-character limit. The decoded submission is bounded to 1 MiB and is never truncated. Oversize input must be rejected by the dispatcher before sending it. See [GitHub's workflow-dispatch limits](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch).

The renderer validates metadata, rebuilds payloads from allowed fields and checks the canonical input hash before rendering. It blocks browser requests outside its loopback origin. The artifact named `theme-job:<id>` in the run title corresponds to an uploaded artifact named `theme-job-<id>`, retained for one day, with exactly one `result.json`. That file contains canonical input, numeric user/run ids, job id, revision, theme hash, both base64 PNGs and their SHA-256 hashes. Consumers must verify the trusted run identity/revision and the input correlation, PNG hashes and dimensions before using the result for repository writes. A matching title alone does not authenticate a run.

## Releases

[`release.yml`](.github/workflows/release.yml) runs [gravity-ui/release-action](https://github.com/gravity-ui/release-action) on pushes to `main`. The action installs dependencies, runs `npm test`, and uses Conventional Commits to prepare a version/changelog release pull request. Merging that release pull request creates the GitHub release and publishes the public npm version. Ordinary feature pushes do not each publish a version.

Repository maintainers configure `GRAVITY_UI_APP_ID`, `GRAVITY_UI_APP_PRIVATE_KEY` and `GRAVITY_UI_BOT_NPM_TOKEN` as GitHub Actions secrets. Keep them out of source files and submission inputs. Release approval and merge remain maintainer actions.

## License

[MIT](LICENSE). Bundled font license texts are in [`licenses/`](licenses/).
