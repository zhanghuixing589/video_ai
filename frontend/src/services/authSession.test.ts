import {describe, expect, it, vi} from 'vitest';
import type {UserInfo} from '../type/api';
import {loadAuthenticatedUser, shouldHandleUnauthorized, storeAuthenticatedUser} from './authSession';

class MemoryStorage {
    private readonly values = new Map<string, string>();

    getItem(key: string) {
        return this.values.get(key) ?? null;
    }

    setItem(key: string, value: string) {
        this.values.set(key, value);
    }

    removeItem(key: string) {
        this.values.delete(key);
    }
}

const reviewer: UserInfo = {
    id: 2,
    username: 'reviewer',
    email: 'reviewer@example.com',
    displayName: '张三',
    role: 'REVIEWER',
    studioStatus: 'NONE',
};

describe('loadAuthenticatedUser', () => {
    it('clears a stale cached user when there is no token', async () => {
        const storage = new MemoryStorage();
        storage.setItem('user', JSON.stringify(reviewer));
        const getCurrentUser = vi.fn();

        const result = await loadAuthenticatedUser(storage, getCurrentUser);

        expect(result).toBeNull();
        expect(storage.getItem('user')).toBeNull();
        expect(getCurrentUser).not.toHaveBeenCalled();
    });

    it('uses the server user when the token is valid', async () => {
        const storage = new MemoryStorage();
        storage.setItem('token', 'valid-token');

        const result = await loadAuthenticatedUser(storage, async () => reviewer);

        expect(result).toEqual(reviewer);
        expect(storage.getItem('user')).toBe(JSON.stringify(reviewer));
    });

    it('clears the session when token validation fails', async () => {
        const storage = new MemoryStorage();
        storage.setItem('token', 'expired-token');
        storage.setItem('user', JSON.stringify(reviewer));

        const result = await loadAuthenticatedUser(storage, async () => {
            throw new Error('expired');
        });

        expect(result).toBeNull();
        expect(storage.getItem('token')).toBeNull();
        expect(storage.getItem('user')).toBeNull();
    });
});

describe('shouldHandleUnauthorized', () => {
    it('ignores a 401 from a request that used an older token', () => {
        expect(shouldHandleUnauthorized('Bearer old-token', 'new-token')).toBe(false);
    });

    it('handles a 401 from the current token', () => {
        expect(shouldHandleUnauthorized('Bearer current-token', 'current-token')).toBe(true);
    });
});

describe('storeAuthenticatedUser', () => {
    it('writes the latest user to the supplied storage', () => {
        const storage = new MemoryStorage();
        const updated = {...reviewer, displayName: '新名称', avatarUrl: '/api/uploads/avatars/avatar.png'};

        storeAuthenticatedUser(storage, updated);

        expect(storage.getItem('user')).toBe(JSON.stringify(updated));
    });
});
