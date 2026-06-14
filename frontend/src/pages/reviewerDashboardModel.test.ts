import { describe, expect, it } from 'vitest';
import {
    getReviewStatusPresentation,
    isContentPublishable,
} from './reviewerDashboardModel';
import type { Content } from '../type/api';

describe('getReviewStatusPresentation', () => {
    it('shows the persisted approved status and allows publishing', () => {
        expect(getReviewStatusPresentation('APPROVED')).toEqual({
            label: '已通过',
            color: 'blue',
            canPublish: true,
        });
    });

    it('shows pending content as waiting for review', () => {
        expect(getReviewStatusPresentation('PENDING')).toEqual({
            label: '待审核',
            color: 'orange',
            canPublish: false,
        });
    });

    it('only publishes when the refreshed server record is approved', () => {
        const approved = { id: 7, status: 'APPROVED' } as Content;
        const pending = { id: 8, status: 'PENDING' } as Content;

        expect(isContentPublishable([approved, pending], 7)).toBe(true);
        expect(isContentPublishable([approved, pending], 8)).toBe(false);
        expect(isContentPublishable([approved, pending], 9)).toBe(false);
    });
});
