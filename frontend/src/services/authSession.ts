import type {UserInfo} from '../type/api';

export interface AuthStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

export const clearAuthSession = (storage: AuthStorage = sessionStorage) => {
    storage.removeItem('token');
    storage.removeItem('user');
};

export const storeAuthenticatedUser = (storage: AuthStorage, user: UserInfo) => {
    storage.setItem('user', JSON.stringify(user));
};

export const shouldHandleUnauthorized = (
    requestAuthorization: string | undefined,
    currentToken: string | null,
): boolean => {
    if (!requestAuthorization) return true;
    return requestAuthorization === `Bearer ${currentToken}`;
};

export const loadAuthenticatedUser = async (
    storage: AuthStorage,
    getCurrentUser: () => Promise<UserInfo>,
): Promise<UserInfo | null> => {
    if (!storage.getItem('token')) {
        clearAuthSession(storage);
        return null;
    }

    try {
        const user = await getCurrentUser();
        storeAuthenticatedUser(storage, user);
        return user;
    } catch {
        clearAuthSession(storage);
        return null;
    }
};
