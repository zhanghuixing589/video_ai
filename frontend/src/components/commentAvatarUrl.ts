export function resolveCommentAvatarUrl(url?: string): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/api/')) {
        return url;
    }
    if (url.startsWith('/uploads/avatars/')) {
        return `/api${url}`;
    }
    return url;
}
