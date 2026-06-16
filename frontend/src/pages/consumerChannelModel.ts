import type {Content, VideoGenre, VideoType} from '../type/api';

export type ConsumerChannel = 'HOME' | VideoType;

export const GENRE_LABELS: Record<VideoGenre, string> = {
    ACTION: '热血',
    ROMANCE: '爱情',
    COMEDY: '喜剧',
    SUSPENSE: '悬疑',
    SCI_FI: '科幻',
    DOCUMENTARY: '纪录片',
    ANIMATION: '动画',
    FAMILY: '家庭',
    REALITY: '真人秀',
    OTHER: '其他',
};

export const GENRE_ORDER = Object.keys(GENRE_LABELS) as VideoGenre[];

export const CHANNELS: ReadonlyArray<{
    channel: ConsumerChannel;
    label: string;
    path: string;
}> = [
    {channel: 'HOME', label: '首页', path: '/'},
    {channel: 'TV_SERIES', label: '电视剧', path: '/tv'},
    {channel: 'MOVIE', label: '电影', path: '/movies'},
    {channel: 'VARIETY', label: '综艺', path: '/variety'},
];

export function getChannelPath(type: VideoType): string {
    return CHANNELS.find(({channel}) => channel === type)?.path ?? '/';
}

export function groupContentByType(contents: Content[]): Record<VideoType, Content[]> {
    const groups: Record<VideoType, Content[]> = {
        TV_SERIES: [],
        MOVIE: [],
        VARIETY: [],
    };

    contents.forEach((item) => groups[item.type].push(item));
    return groups;
}

export function getChannelContent(contents: Content[], channel: ConsumerChannel): Content[] {
    return channel === 'HOME' ? contents : contents.filter((item) => item.type === channel);
}

export function getAvailableGenres(contents: Content[]): VideoGenre[] {
    const available = new Set(contents.map((item) => item.genre));
    return GENRE_ORDER.filter((genre) => available.has(genre));
}

export function normalizeGenre(value: string | null | undefined): VideoGenre | null {
    return value && GENRE_ORDER.includes(value as VideoGenre) ? value as VideoGenre : null;
}

export function filterContentByGenre(contents: Content[], genre: VideoGenre | null): Content[] {
    return genre ? contents.filter((item) => item.genre === genre) : contents;
}
