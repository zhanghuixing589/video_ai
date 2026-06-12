import {describe, expect, it} from 'vitest';
import {
    clearAuthNotice,
    consumeAuthNotice,
    isSessionReplacedResponse,
    isSessionReplacedMessage,
    readAuthNotice,
    storeAuthNotice,
} from './authNotice';

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

describe('authentication notices', () => {
    it('stores and consumes the session-replaced notice', () => {
        const storage = new MemoryStorage();

        storeAuthNotice(storage, 'SESSION_REPLACED');

        expect(consumeAuthNotice(storage)).toBe('您的账号已在其他设备登录，请重新登录');
    });

    it('only consumes a notice once', () => {
        const storage = new MemoryStorage();
        storeAuthNotice(storage, 'SESSION_REPLACED');

        consumeAuthNotice(storage);

        expect(consumeAuthNotice(storage)).toBeNull();
    });

    it('can read without deleting until the login page finishes mounting', () => {
        const storage = new MemoryStorage();
        storeAuthNotice(storage, 'SESSION_REPLACED');

        expect(readAuthNotice(storage)).toBe('您的账号已在其他设备登录，请重新登录');
        expect(readAuthNotice(storage)).toBe('您的账号已在其他设备登录，请重新登录');

        clearAuthNotice(storage);
        expect(readAuthNotice(storage)).toBeNull();
    });

    it('ignores unknown notice codes', () => {
        const storage = new MemoryStorage();
        storage.setItem('auth:notice', 'UNKNOWN');

        expect(consumeAuthNotice(storage)).toBeNull();
    });

    it('recognizes the backend session-replaced message', () => {
        expect(isSessionReplacedMessage('您的账号已在其他设备登录，请重新登录')).toBe(true);
        expect(isSessionReplacedMessage('请先登录')).toBe(false);
        expect(isSessionReplacedMessage(undefined)).toBe(false);
    });

    it('prefers the stable backend reason code', () => {
        expect(isSessionReplacedResponse('SESSION_REPLACED', '乱码')).toBe(true);
        expect(isSessionReplacedResponse(undefined, '您的账号已在其他设备登录，请重新登录')).toBe(true);
        expect(isSessionReplacedResponse(undefined, '请先登录')).toBe(false);
    });
});
