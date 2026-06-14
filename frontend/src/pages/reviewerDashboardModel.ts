import type { Content, VideoStatus } from '../type/api';

type ReviewStatusPresentation = {
    label: string;
    color: string;
    canPublish: boolean;
};

const statusPresentations: Record<VideoStatus, ReviewStatusPresentation> = {
    DRAFT: { label: '草稿', color: 'default', canPublish: false },
    PENDING: { label: '待审核', color: 'orange', canPublish: false },
    APPROVED: { label: '已通过', color: 'blue', canPublish: true },
    REJECTED: { label: '已拒绝', color: 'red', canPublish: false },
    PUBLISHED: { label: '已发布', color: 'green', canPublish: false },
    BANNED: { label: '已下架', color: 'default', canPublish: false },
};

export const getReviewStatusPresentation = (
    status: VideoStatus,
): ReviewStatusPresentation => statusPresentations[status];

export const isContentPublishable = (
    contents: Content[],
    contentId: number,
): boolean => contents.some(
    (content) => content.id === contentId && content.status === 'APPROVED',
);
