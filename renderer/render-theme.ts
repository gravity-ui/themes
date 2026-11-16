import type {ThemePayload, ThemePreviewMode} from '../lib/schema';

export interface RenderThemeData {
    payload: ThemePayload;
    mode: ThemePreviewMode;
}

declare global {
    interface Window {
        renderTheme?: (data: RenderThemeData) => void;
    }
}
