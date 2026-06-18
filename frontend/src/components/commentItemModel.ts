import type {ContentComment} from '../type/api';

export function mergeLikedComment(
    current: ContentComment,
    updated: ContentComment,
): ContentComment {
    return {
        ...current,
        ...updated,
        replies: current.replies || [],
    };
}

export function getReplyPrefix(parentAuthorName?: string): string {
    const name = parentAuthorName?.trim();
    return name ? `回复${name}:` : '';
}
