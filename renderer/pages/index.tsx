import type {ThemePayload, ThemePreviewMode} from '../../lib/schema';
import React from 'react';
import {generateCSS, parseJSON} from '@gravity-ui/uikit-themer';
import {PreviewLayout} from '../components/PreviewLayout';
import {TablePreview} from '../components/TablePreview';
import {normalizeImportedTheme} from '../../lib/normalize-imported';

interface RenderThemeData {
    payload: ThemePayload;
    mode: ThemePreviewMode;
}

declare global {
    interface Window {
        renderTheme?: (data: RenderThemeData) => void;
    }
}

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
const scopeCss = (css: string, name: string) => css
    .replace('.g-root {', `.g-root.${name}, .${name} .g-root {`)
    .replace('.g-root_theme_dark {', `.g-root_theme_dark.${name}_theme_dark, .${name}_theme_dark .g-root_theme_dark {`)
    .replace('.g-root_theme_light {', `.g-root_theme_light.${name}_theme_light, .${name}_theme_light .g-root_theme_light {`);
export default function Capture() {
    const [data, setData] = React.useState<RenderThemeData | null>(null);
    React.useEffect(() => {
        window.renderTheme = setData;
        return () => { delete window.renderTheme; };
    }, []);
    React.useEffect(() => {
        if (!data) return;
        document.fonts.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(() => {
            document.documentElement.dataset.themePreviewReady = '1';
        })));
    }, [data]);
    if (!data) return null;
    const css = generateCSS({theme: normalizeImportedTheme(parseJSON(toParserPayload(data.payload)), data.payload), ignoreDefaultValues: false, forPreview: true, libraries: ['illustrations']});
    return <div id="capture-root" className={`g-root g-root_theme_${data.mode}`} style={{width: 555, height: 375, overflow: 'hidden', background: 'var(--g-color-base-background)'}}>
        <style>{scopeCss(css, 'gravity-ui-landing-themes-preview-layout')}</style>
<div style={{width: 740}}><PreviewLayout id="table" breadCrumbsItems={['Table']} initialTheme={data.mode}>{(props) => <TablePreview {...props} />}</PreviewLayout></div>
    </div>;
}
