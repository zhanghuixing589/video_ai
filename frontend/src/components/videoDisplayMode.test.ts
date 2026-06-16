import {describe, expect, it} from 'vitest';
import {
    getVideoDisplayStyle,
    normalizeVideoDisplayMode,
    VIDEO_DISPLAY_OPTIONS,
} from './videoDisplayMode';

describe('videoDisplayMode', () => {
    it('maps each display mode to the intended video fit behavior', () => {
        expect(getVideoDisplayStyle('contain')).toEqual({
            objectFit: 'contain',
            objectPosition: 'center',
        });
        expect(getVideoDisplayStyle('fill')).toEqual({
            objectFit: 'fill',
            objectPosition: 'center',
        });
        expect(getVideoDisplayStyle('cover')).toEqual({
            objectFit: 'cover',
            objectPosition: 'center',
        });
    });

    it('defaults unknown values to proportional scaling', () => {
        expect(normalizeVideoDisplayMode(undefined)).toBe('contain');
        expect(normalizeVideoDisplayMode('unknown')).toBe('contain');
        expect(normalizeVideoDisplayMode('cover')).toBe('cover');
    });

    it('exposes the three user-facing choices in display order', () => {
        expect(VIDEO_DISPLAY_OPTIONS.map(({value, label}) => ({value, label}))).toEqual([
            {value: 'contain', label: '等比例缩放'},
            {value: 'fill', label: '铺满大屏 / 16:9'},
            {value: 'cover', label: '智能裁剪'},
        ]);
    });
});
