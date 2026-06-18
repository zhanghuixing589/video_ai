import {describe, expect, it} from 'vitest';
import {resolveCommentAvatarUrl} from './commentAvatarUrl';
import {getReplyPrefix, mergeLikedComment} from './commentItemModel';

describe('CommentItem', () => {
    it('routes backend-relative avatar uploads through the API proxy', () => {
        expect(resolveCommentAvatarUrl('/uploads/avatars/viewer.webp'))
            .toBe('/api/uploads/avatars/viewer.webp');
        expect(resolveCommentAvatarUrl('/api/uploads/avatars/viewer.webp'))
            .toBe('/api/uploads/avatars/viewer.webp');
        expect(resolveCommentAvatarUrl('https://cdn.example.com/viewer.webp'))
            .toBe('https://cdn.example.com/viewer.webp');
        expect(resolveCommentAvatarUrl(undefined)).toBeUndefined();
    });

    it('keeps existing replies when merging a like response', () => {
        const reply = {
            id: 11,
            contentId: 1,
            userId: 3,
            authorUsername: 'reply-user',
            body: 'reply',
            likeCount: 0,
            replyCount: 0,
            likedByCurrentUser: false,
            createdAt: '2026-06-18T10:00:00',
            parentId: 10,
            rootId: 10,
            replies: [],
        };
        const current = {
            id: 10,
            contentId: 1,
            userId: 2,
            authorUsername: 'root-user',
            body: 'root',
            likeCount: 0,
            replyCount: 1,
            likedByCurrentUser: false,
            createdAt: '2026-06-18T09:00:00',
            parentId: null,
            rootId: 10,
            replies: [reply],
        };
        const likeResponse = {
            ...current,
            likeCount: 1,
            likedByCurrentUser: true,
            replies: [],
        };

        expect(mergeLikedComment(current, likeResponse).replies).toEqual([reply]);
        expect(mergeLikedComment(current, likeResponse).likeCount).toBe(1);
    });

    it('formats reply context with the parent author name', () => {
        expect(getReplyPrefix('casior')).toBe('回复casior:');
        expect(getReplyPrefix('')).toBe('');
        expect(getReplyPrefix(undefined)).toBe('');
    });
});
