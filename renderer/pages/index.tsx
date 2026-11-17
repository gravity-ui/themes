import React from 'react';

import {generateCSS, parseJSON} from '@gravity-ui/uikit-themer';

import {normalizeImportedTheme} from '../../lib/normalize-imported';
import type {ThemePayload} from '../../lib/schema';
import {PreviewLayout} from '../components/PreviewLayout';
import {TablePreview} from '../components/TablePreview';
import {PREVIEW_LAYOUT_CLASS} from '../components/block';
import type {RenderThemeData} from '../render-theme';

// A 555x375 card frame over the Table sample rendered at its natural ~740px width.
const PREVIEW_WIDTH = 555;
const PREVIEW_HEIGHT = 375;
const SAMPLE_WIDTH = 740;

// The Themer parser ignores incomplete per-mode entries.
const toParserPayload = (payload: ThemePayload): Parameters<typeof parseJSON>[0] => {
    const result: Parameters<typeof parseJSON>[0] = {};
    for (const [key, entry] of Object.entries(payload)) {
        if ('value' in entry) {
            result[key] = entry;
        } else if (entry.light && entry.dark) {
            result[key] = {light: entry.light, dark: entry.dark};
        }
    }
    return result;
};

// Scope generated CSS to the isolated preview.
const scopeCss = (css: string, name: string) =>
    css
        .replace('.g-root {', `.g-root.${name}, .${name} .g-root {`)
        .replace(
            '.g-root_theme_dark {',
            `.g-root_theme_dark.${name}_theme_dark, .${name}_theme_dark .g-root_theme_dark {`,
        )
        .replace(
            '.g-root_theme_light {',
            `.g-root_theme_light.${name}_theme_light, .${name}_theme_light .g-root_theme_light {`,
        );
export default function Capture() {
    const [data, setData] = React.useState<RenderThemeData | null>(null);
    React.useEffect(() => {
        window.renderTheme = setData;
        return () => {
            delete window.renderTheme;
        };
    }, []);
    React.useEffect(() => {
        if (!data) {
            return;
        }
        document.fonts.ready.then(() =>
            requestAnimationFrame(() =>
                requestAnimationFrame(() => {
                    document.documentElement.dataset.themePreviewReady = '1';
                }),
            ),
        );
    }, [data]);
    if (!data) {
        return null;
    }
    const css = generateCSS({
        theme: normalizeImportedTheme(parseJSON(toParserPayload(data.payload)), data.payload),
        ignoreDefaultValues: false,
        forPreview: true,
        libraries: ['illustrations'],
    });
    return (
        <div
            id="capture-root"
            className={`g-root g-root_theme_${data.mode}`}
            style={{
                width: PREVIEW_WIDTH,
                height: PREVIEW_HEIGHT,
                overflow: 'hidden',
                background: 'var(--g-color-base-background)',
            }}
        >
            <style>{scopeCss(css, PREVIEW_LAYOUT_CLASS)}</style>
            <div style={{width: SAMPLE_WIDTH}}>
                <PreviewLayout id="table" breadCrumbsItems={['Table']} initialTheme={data.mode}>
                    {(props) => <TablePreview {...props} />}
                </PreviewLayout>
            </div>
        </div>
    );
}
