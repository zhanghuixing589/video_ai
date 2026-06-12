import type {UserInfo} from '../type/api';

interface AuthStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

export const clearAuthSession = (storage: AuthStorage = localStorage) => {
    storage.removeItem('token');
    storage.removeItem('user');
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
        storage.setItem('user', JSON.stringify(user));
        return user;
    } catch {
        clearAuthSession(storage);
        return null;
    }
};
