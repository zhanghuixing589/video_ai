import {describe, expect, it} from 'vitest';
import type {Content} from '../type/api';
import {
    buildPublishChecks,
    flattenEpisodeRows,
    formatDuration,
    formatFileSize,
} from './studioWorkspaceModel';

const series: Content = {
    id: 1,
    title: '山海之旅',
    description: '穿越山川与湖泊',
    coverUrl: '/api/uploads/covers/cover.png',
    type: 'TV_SERIES',
    genre: 'DOCUMENTARY',
    status: 'DRAFT',
    studioId: 9,
    episodes: [],
    seasons: [{
        id: 10,
        seasonNumber: 1,
        title: '第一季',
        sortOrder: 1,
        episodes: [{
            id: 100,
            episodeNumber: 1,
            title: '山河初现',
            videoUrl: '/api/uploads/videos/episode-1.mp4',
            originalFileName: 'EP01_山河初现_1080p.mp4',
            durationSeconds: 2712,
            previewSeconds: 300,
            sortOrder: 1,
        }],
    }],
};

describe('studioWorkspaceModel', () => {
    it('flattens season episodes with season context', () => {
        expect(flattenEpisodeRows(series)).toEqual([
            expect.objectContaining({
                seasonId: 10,
                seasonNumber: 1,
                episodeNumber: 1,
                originalFileName: 'EP01_山河初现_1080p.mp4',
            }),
        ]);
    });

    it('calculates publish readiness from content and preview state', () => {
        expect(buildPublishChecks(series, true)).toEqual([
            expect.objectContaining({key: 'cover', complete: true}),
            expect.objectContaining({key: 'metadata', complete: true}),
            expect.objectContaining({key: 'media', complete: true}),
            expect.objectContaining({key: 'preview', complete: true}),
        ]);
    });

    it('marks missing media as incomplete', () => {
        const emptyMovie: Content = {
            ...series,
            type: 'MOVIE',
            coverUrl: undefined,
            description: undefined,
            seasons: [],
            episodes: [],
        };

        expect(buildPublishChecks(emptyMovie, false).map((item) => item.complete))
            .toEqual([false, false, false, false]);
    });

    it('formats file sizes and durations for the media table', () => {
        expect(formatFileSize(2.38 * 1024 * 1024 * 1024)).toBe('2.38 GB');
        expect(formatFileSize(720 * 1024)).toBe('720 KB');
        expect(formatDuration(2712)).toBe('45:12');
        expect(formatDuration(65)).toBe('01:05');
    });
});
