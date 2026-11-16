import blockFactory from 'bem-cn-lite';

export const PREVIEW_LAYOUT_CLASS = 'gravity-ui-themes-preview-layout';

export const block = (name: string) => blockFactory(`gravity-ui-${name}`);
