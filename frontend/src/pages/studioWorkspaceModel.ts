import type {Content, Episode} from '../type/api';

export interface EpisodeRow extends Episode {
    seasonId?: number;
    seasonNumber?: number;
    seasonTitle?: string;
}

export interface PublishCheck {
    key: 'cover' | 'metadata' | 'media' | 'preview';
    label: string;
    detail: string;
    complete: boolean;
}

export function flattenEpisodeRows(content?: Content): EpisodeRow[] {
    if (!content) return [];
    const movieRows: EpisodeRow[] = content.episodes.map((episode) => ({...episode}));
    const seasonRows: EpisodeRow[] = content.seasons.flatMap((season) =>
        season.episodes.map((episode) => ({
            ...episode,
            seasonId: season.id,
            seasonNumber: season.seasonNumber,
            seasonTitle: season.title,
        })),
    );
    return [...movieRows, ...seasonRows].sort((left, right) => {
        const seasonDifference = (left.seasonNumber ?? 0) - (right.seasonNumber ?? 0);
        return seasonDifference || left.sortOrder - right.sortOrder;
    });
}

export function buildPublishChecks(content?: Content, previewed = false): PublishCheck[] {
    const rows = flattenEpisodeRows(content);
    const metadataComplete = Boolean(
        content?.title.trim()
        && content.description?.trim()
        && content.genre
        && content.type,
    );
    return [
        {
            key: 'cover',
            label: '封面已上传',
            detail: content?.coverUrl ? '作品封面已就绪' : '请上传作品封面',
            complete: Boolean(content?.coverUrl),
        },
        {
            key: 'metadata',
            label: '基本信息完整',
            detail: metadataComplete ? '名称、类型、题材和简介完整' : '请完善作品简介等信息',
            complete: metadataComplete,
        },
        {
            key: 'media',
            label: content?.type === 'MOVIE' ? '正片已上传' : '剧集已上传',
            detail: rows.length ? `已上传 ${rows.length} 个视频文件` : '至少上传一个视频文件',
            complete: rows.length > 0,
        },
        {
            key: 'preview',
            label: '预览通过',
            detail: previewed ? '已完成播放预览' : '请播放检查视频内容',
            complete: previewed,
        },
    ];
}

export function formatFileSize(bytes?: number): string {
    if (!bytes || bytes <= 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }
    const digits = unitIndex >= 3 ? 2 : value >= 10 || unitIndex === 0 ? 0 : 1;
    return `${value.toFixed(digits)} ${units[unitIndex]}`;
}

export function formatDuration(seconds?: number): string {
    if (!seconds || seconds < 0) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const base = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    return hours ? `${String(hours).padStart(2, '0')}:${base}` : base;
}
