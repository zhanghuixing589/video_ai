export type VideoDisplayMode = 'contain' | 'fill' | 'cover';

export const VIDEO_DISPLAY_OPTIONS: ReadonlyArray<{
    value: VideoDisplayMode;
    label: string;
    description: string;
}> = [
    {
        value: 'contain',
        label: '等比例缩放',
        description: '保持完整画面',
    },
    {
        value: 'fill',
        label: '铺满大屏 / 16:9',
        description: '拉伸填满播放器',
    },
    {
        value: 'cover',
        label: '智能裁剪',
        description: '居中放大并裁剪边缘',
    },
];

export function normalizeVideoDisplayMode(value: unknown): VideoDisplayMode {
    return value === 'fill' || value === 'cover' ? value : 'contain';
}

export function getVideoDisplayStyle(mode: VideoDisplayMode): {
    objectFit: VideoDisplayMode;
    objectPosition: 'center';
} {
    return {
        objectFit: mode,
        objectPosition: 'center',
    };
}
