import {describe, expect, it} from 'vitest';
import type {Content, VideoGenre, VideoType} from '../type/api';
import {
    CHANNELS,
    filterContentByGenre,
    getAvailableGenres,
    getChannelContent,
    getChannelPath,
    groupContentByType,
    normalizeGenre,
} from './consumerChannelModel';

function content(id: number, type: VideoType, genre: VideoGenre): Content {
    return {
        id,
        title: `作品 ${id}`,
        type,
        genre,
        status: 'PUBLISHED',
        studioId: 1,
        seasons: [],
        episodes: [],
    };
}

const contents = [
    content(1, 'TV_SERIES', 'ANIMATION'),
    content(2, 'TV_SERIES', 'ACTION'),
    content(3, 'MOVIE', 'COMEDY'),
    content(4, 'VARIETY', 'REALITY'),
];

describe('consumerChannelModel', () => {
    it('defines stable routes for home and the three content channels', () => {
        expect(CHANNELS.map(({channel, path}) => ({channel, path}))).toEqual([
            {channel: 'HOME', path: '/'},
            {channel: 'TV_SERIES', path: '/tv'},
            {channel: 'MOVIE', path: '/movies'},
            {channel: 'VARIETY', path: '/variety'},
        ]);

        expect(getChannelPath('TV_SERIES')).toBe('/tv');
        expect(getChannelPath('MOVIE')).toBe('/movies');
        expect(getChannelPath('VARIETY')).toBe('/variety');
    });

    it('groups the home catalog and restricts channel catalogs by video type', () => {
        const grouped = groupContentByType(contents);

        expect(grouped.TV_SERIES.map((item) => item.id)).toEqual([1, 2]);
        expect(grouped.MOVIE.map((item) => item.id)).toEqual([3]);
        expect(grouped.VARIETY.map((item) => item.id)).toEqual([4]);
        expect(getChannelContent(contents, 'TV_SERIES').map((item) => item.id)).toEqual([1, 2]);
        expect(getChannelContent(contents, 'HOME')).toEqual(contents);
    });

    it('derives only available genres in the configured label order', () => {
        const unordered = [
            content(5, 'TV_SERIES', 'ANIMATION'),
            content(6, 'TV_SERIES', 'ACTION'),
            content(7, 'TV_SERIES', 'COMEDY'),
        ];

        expect(getAvailableGenres(unordered)).toEqual(['ACTION', 'COMEDY', 'ANIMATION']);
    });

    it('normalizes requested genres and filters channel content', () => {
        expect(normalizeGenre('ANIMATION')).toBe('ANIMATION');
        expect(normalizeGenre('UNKNOWN')).toBeNull();
        expect(normalizeGenre(null)).toBeNull();
        expect(filterContentByGenre(contents, null)).toEqual(contents);
        expect(filterContentByGenre(contents, 'ANIMATION').map((item) => item.id)).toEqual([1]);
    });
});
