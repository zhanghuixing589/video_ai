import type {Content, Episode} from '../type/api';

export interface PlaybackEpisode extends Episode {
    seasonId?: number;
    seasonNumber?: number;
    seasonTitle?: string;
}

export type PlaybackResolution =
    | {status: 'ready'; content: Content; episode: PlaybackEpisode; episodes: PlaybackEpisode[]}
    | {status: 'invalid-route' | 'content-not-found' | 'episode-not-found' | 'no-episodes'};

export function flattenPlaybackEpisodes(content?: Content): PlaybackEpisode[] {
    if (!content) return [];

    const directEpisodes: PlaybackEpisode[] = content.episodes.map((episode) => ({...episode}));
    const seasonEpisodes = content.seasons.flatMap((season) =>
        season.episodes.map((episode) => ({
            ...episode,
            seasonId: season.id,
            seasonNumber: season.seasonNumber,
            seasonTitle: season.title,
        })),
    );

    return [...directEpisodes, ...seasonEpisodes].sort((left, right) =>
        left.episodeNumber - right.episodeNumber
        || left.sortOrder - right.sortOrder
        || left.id - right.id,
    );
}

export function getFirstPlayableEpisode(content?: Content): PlaybackEpisode | undefined {
    return flattenPlaybackEpisodes(content).find((episode) => Boolean(episode.videoUrl));
}

export function buildPlaybackPath(contentId: number, episodeId: number): string {
    return `/play/${contentId}/${episodeId}`;
}

export function resolvePlayback(
    contents: Content[],
    contentIdValue?: string,
    episodeIdValue?: string,
): PlaybackResolution {
    const contentId = Number(contentIdValue);
    const episodeId = Number(episodeIdValue);
    if (!Number.isInteger(contentId) || !Number.isInteger(episodeId) || contentId <= 0 || episodeId <= 0) {
        return {status: 'invalid-route'};
    }

    const content = contents.find((item) => item.id === contentId);
    if (!content) return {status: 'content-not-found'};

    const episodes = flattenPlaybackEpisodes(content);
    if (episodes.length === 0) return {status: 'no-episodes'};

    const episode = episodes.find((item) => item.id === episodeId);
    if (!episode) return {status: 'episode-not-found'};

    return {status: 'ready', content, episode, episodes};
}
