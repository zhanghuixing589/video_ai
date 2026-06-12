interface NoticeStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

export type AuthNoticeCode = 'SESSION_REPLACED';

const AUTH_NOTICE_KEY = 'auth:notice';

const authNoticeMessages: Record<AuthNoticeCode, string> = {
    SESSION_REPLACED: '您的账号已在其他设备登录，请重新登录',
};

export const storeAuthNotice = (storage: NoticeStorage, code: AuthNoticeCode) => {
    storage.setItem(AUTH_NOTICE_KEY, code);
};

export const readAuthNotice = (storage: NoticeStorage): string | null => {
    const code = storage.getItem(AUTH_NOTICE_KEY);
    return code && code in authNoticeMessages
        ? authNoticeMessages[code as AuthNoticeCode]
        : null;
};

export const clearAuthNotice = (storage: NoticeStorage) => {
    storage.removeItem(AUTH_NOTICE_KEY);
};

export const consumeAuthNotice = (storage: NoticeStorage): string | null => {
    const notice = readAuthNotice(storage);
    clearAuthNotice(storage);
    return notice;
};

export const isSessionReplacedMessage = (value: unknown): boolean =>
    typeof value === 'string' && value.includes('其他设备登录');

export const isSessionReplacedResponse = (reason: unknown, message: unknown): boolean =>
    reason === 'SESSION_REPLACED' || isSessionReplacedMessage(message);
