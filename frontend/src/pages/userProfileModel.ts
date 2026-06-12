import type {Role} from '../type/api';

export type ProfileTabKey = 'profile' | 'videos' | 'history' | 'security';

export const getProfileTabKeys = (role: Role): ProfileTabKey[] => {
    if (role === 'STUDIO') return ['profile', 'videos', 'security'];
    if (role === 'USER') return ['profile', 'history', 'security'];
    return ['profile', 'security'];
};

export const validateAvatarFile = (file: Pick<File, 'type' | 'size'>): string | null => {
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
        return '头像仅支持 JPG、PNG 或 WebP 格式';
    }
    if (file.size > 5 * 1024 * 1024) {
        return '头像大小不能超过 5 MB';
    }
    return null;
};
