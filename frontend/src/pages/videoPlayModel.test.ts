import {describe, expect, it} from 'vitest';
import type {Content} from '../type/api';
import * as videoPlayModel from './videoPlayModel';
import {
    buildPlaybackPath,
    flattenPlaybackEpisodes,
    getFirstPlayableEpisode,
    resolveAvatarUrl,
    resolvePlayback,
} from './videoPlayModel';

const content: Content = {
    id: 7,
    title: '仙途长歌',
    description: '少年踏上漫长修行路。',
    coverUrl: '/covers/immortal-road.jpg',
    type: 'TV_SERIES',
    genre: 'ANIMATION',
    status: 'PUBLISHED',
    studioId: 3,
    episodes: [{
        id: 30,
        episodeNumber: 3,
        title: '旧友重逢',
        videoUrl: '/videos/episode-3.mp4',
        durationSeconds: 1500,
        previewSeconds: 120,
        sortOrder: 3,
    }],
    seasons: [{
        id: 11,
        seasonNumber: 1,
        title: '第一季',
        sortOrder: 1,
        episodes: [{
            id: 10,
            episodeNumber: 1,
            title: '初入仙门',
            videoUrl: '/videos/episode-1.mp4',
            durationSeconds: 1440,
            previewSeconds: 120,
            sortOrder: 1,
        }, {
            id: 20,
            episodeNumber: 2,
            title: '山门试炼',
            videoUrl: '/videos/episode-2.mp4',
            durationSeconds: 1480,
            previewSeconds: 120,
            sortOrder: 2,
        }],
    }],
};

describe('videoPlayModel', () => {
    it('flattens direct and season episodes into stable playback order', () => {
        expect(flattenPlaybackEpisodes(content).map((episode) => episode.id))
            .toEqual([10, 20, 30]);
    });

    it('selects the first playable episode and builds its route', () => {
        const firstEpisode = getFirstPlayableEpisode(content);

        expect(firstEpisode?.id).toBe(10);
        expect(buildPlaybackPath(content.id, firstEpisode!.id)).toBe('/play/7/10');
    });

    it('strictly resolves the requested work and episode', () => {
        expect(resolvePlayback([content], '7', '20')).toEqual({
            status: 'ready',
            content,
            episode: expect.objectContaining({id: 20}),
            episodes: expect.arrayContaining([
                expect.objectContaining({id: 10}),
                expect.objectContaining({id: 20}),
            ]),
        });

        expect(resolvePlayback([content], '7', '999')).toEqual({status: 'episode-not-found'});
        expect(resolvePlayback([content], '999', '20')).toEqual({status: 'content-not-found'});
        expect(resolvePlayback([content], 'bad', '20')).toEqual({status: 'invalid-route'});
    });

    it('routes backend-relative avatar uploads through the API proxy', () => {
        expect(resolveAvatarUrl('/uploads/avatars/viewer.png')).toBe('/api/uploads/avatars/viewer.png');
        expect(resolveAvatarUrl('/api/uploads/avatars/viewer.png')).toBe('/api/uploads/avatars/viewer.png');
        expect(resolveAvatarUrl('https://cdn.example.com/viewer.png')).toBe('https://cdn.example.com/viewer.png');
        expect(resolveAvatarUrl(undefined)).toBeUndefined();
    });

    it('does not expose playback demo data generators', () => {
        expect('buildPlaybackDemo' in videoPlayModel).toBe(false);
    });
});
