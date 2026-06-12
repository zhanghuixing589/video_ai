import {describe, expect, it} from 'vitest';
import {getProfileTabKeys, validateAvatarFile} from './userProfileModel';

describe('getProfileTabKeys', () => {
    it('shows studio works only for studios', () => {
        expect(getProfileTabKeys('STUDIO')).toEqual(['profile', 'videos', 'security']);
    });

    it('keeps a browsing-history placeholder for ordinary users', () => {
        expect(getProfileTabKeys('USER')).toEqual(['profile', 'history', 'security']);
    });

    it('shows only profile and security for reviewers and administrators', () => {
        expect(getProfileTabKeys('REVIEWER')).toEqual(['profile', 'security']);
        expect(getProfileTabKeys('ADMIN')).toEqual(['profile', 'security']);
    });
});

describe('validateAvatarFile', () => {
    it('accepts JPEG, PNG and WebP files up to 5 MB', () => {
        expect(validateAvatarFile({type: 'image/jpeg', size: 1024})).toBeNull();
        expect(validateAvatarFile({type: 'image/png', size: 1024})).toBeNull();
        expect(validateAvatarFile({type: 'image/webp', size: 1024})).toBeNull();
    });

    it('rejects unsupported files and files larger than 5 MB', () => {
        expect(validateAvatarFile({type: 'image/gif', size: 1024})).toContain('JPG');
        expect(validateAvatarFile({type: 'image/png', size: 5 * 1024 * 1024 + 1})).toContain('5 MB');
    });
});
