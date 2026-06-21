import {beforeEach, describe, expect, it, vi} from 'vitest';

const http = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    interceptors: {
        request: {use: vi.fn()},
        response: {use: vi.fn()},
    },
}));

vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => http),
        isAxiosError: vi.fn(() => false),
    },
}));

describe('contentEngagementApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('unwraps persisted comments from the ApiResponse envelope', async () => {
        const comment = {
            id: 7,
            contentId: 1,
            userId: 2,
            authorUsername: 'viewer',
            authorDisplayName: 'Viewer',
            body: 'Loaded from database',
            likeCount: 0,
            replyCount: 0,
            likedByCurrentUser: false,
            createdAt: '2026-06-18T10:00:00',
            updatedAt: '2026-06-18T10:00:00',
            parentId: null,
            rootId: 7,
            replies: [],
        };
        http.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'ok',
                data: [comment],
            },
        });
        const {contentEngagementApi} = await import('./api');

        await expect(contentEngagementApi.listComments(1)).resolves.toEqual([comment]);
    });

    it('fetches video transcode job status from the media endpoint', async () => {
        const job = {
            jobId: 42,
            status: 'COMPLETED',
            sourceUrl: 'http://localhost:9000/raw-videos/sources/video.mp4',
            hlsUrl: 'http://localhost:9000/hls-videos/jobs/42/index.m3u8',
            fileName: 'episode.mp4',
            size: 24,
            contentType: 'video/mp4',
        };
        http.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'ok',
                data: job,
            },
        });
        const {mediaApi} = await import('./api');

        await expect(mediaApi.getVideoJob(42)).resolves.toEqual(job);
        expect(http.get).toHaveBeenCalledWith('/media/videos/jobs/42');
    });
});
