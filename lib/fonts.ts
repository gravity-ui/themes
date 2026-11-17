export const DEFAULT_FONT_FAMILIES = ['sans', 'monospace'] as const;
export const BUILT_IN_FONTS: Readonly<Record<string, readonly string[]>> = {
    sans: ['Inter', 'Merriweather', 'Titillium Web'],
    monospace: ['Roboto Mono', 'Ubuntu Mono', 'IBM Plex Mono'],
};
export function isBuiltInFontFamily(type: string, name: string) {
    // Own keys only: `toString` or `__proto__` must not resolve to Object.prototype members.
    return (
        Object.prototype.hasOwnProperty.call(BUILT_IN_FONTS, type) &&
        BUILT_IN_FONTS[type].includes(name)
    );
}
