export const DEFAULT_FONT_FAMILIES = ['sans', 'monospace'] as const;
export const BUILT_IN_FONTS: Readonly<Record<string, readonly string[]>> = {
    sans: ['Inter', 'Merriweather', 'Titillium Web'],
    monospace: ['Roboto Mono', 'Ubuntu Mono', 'IBM Plex Mono'],
};
export function isBuiltInFontFamily(type: string, name: string) {
    return Boolean(BUILT_IN_FONTS[type]?.includes(name));
}
