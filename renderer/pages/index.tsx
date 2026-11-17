import React from 'react';

import {generateCSS, parseJSON} from '@gravity-ui/uikit-themer';

import {normalizeImportedTheme} from '../../lib/normalize-imported';
import {PreviewLayout} from '../components/PreviewLayout';
import {TablePreview} from '../components/TablePreview';
import {PREVIEW_LAYOUT_CLASS} from '../components/block';
import type {RenderThemeData} from '../render-theme';

// A 555x375 card frame over the Table sample rendered at its natural ~740px width.
const PREVIEW_WIDTH = 555;
const PREVIEW_HEIGHT = 375;
const SAMPLE_WIDTH = 740;

// Scope generated CSS to the isolated preview and to the capture root, whose
// background shows in the rounded corners of the preview layout.
const scopeCss = (css: string, name: string) =>
    css
        .replace('.g-root {', `.g-root.${name}, .${name} .g-root, #capture-root.g-root {`)
        .replace(
            '.g-root_theme_dark {',
            `.g-root_theme_dark.${name}_theme_dark, .${name}_theme_dark .g-root_theme_dark, #capture-root.g-root_theme_dark {`,
        )
        .replace(
            '.g-root_theme_light {',
            `.g-root_theme_light.${name}_theme_light, .${name}_theme_light .g-root_theme_light, #capture-root.g-root_theme_light {`,
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
        theme: normalizeImportedTheme(parseJSON(data.payload), data.payload),
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
