import axios, {type AxiosProgressEvent, type AxiosResponse} from 'axios';
import type {
    ApiResponse,
    Content,
    ContentComment,
    ContentRatingRequest,
    ContentRatingSummary,
    CreateUserRequest,
    LoginRequest,
    LoginResponse,
    MediaUploadResult,
    PasswordUpdateRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    StudioApplicationRequest,
    UserInfo,
    UserRecord,
    CommentLikeRequest, CommentRequest,
} from '../type/api';
import {clearAuthSession, shouldHandleUnauthorized} from './authSession';
import {isSessionReplacedResponse, storeAuthNotice} from './authNotice';

const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/auth/login');
        if (error.response?.status === 401 && !isLoginRequest) {
            const requestAuthorization = error.config?.headers?.Authorization;
            const authorization = typeof requestAuthorization === 'string'
                ? requestAuthorization
                : undefined;
            if (!shouldHandleUnauthorized(authorization, sessionStorage.getItem('token'))) {
                return Promise.reject(error);
            }
            clearAuthSession(sessionStorage);
            if (isSessionReplacedResponse(
                error.response?.headers?.['x-auth-reason'],
                error.response?.data?.message,
            )) {
                storeAuthNotice(sessionStorage, 'SESSION_REPLACED');
            }
            if (window.location.pathname !== '/login') {
                window.location.replace('/login');
            }
        }
        return Promise.reject(error);
    }
);

const unwrap = <T>(response: AxiosResponse<ApiResponse<T>>): T => response.data.data;

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
        return error.response?.data?.message || fallback;
    }
    return fallback;
};

export const authApi = {
    login: (data: LoginRequest) => api.post<ApiResponse<LoginResponse>>('/auth/login', data).then(unwrap),
    register: (data: RegisterRequest) => api.post<ApiResponse<UserInfo>>('/auth/register', data).then(unwrap),
    me: () => api.get<ApiResponse<UserInfo>>('/auth/me').then(unwrap),
    // 退出登录（调用后端接口清除 session）
    logout: () => api.post('/auth/logout').finally(() => clearAuthSession(sessionStorage)),

    // 清除本地存储
    clearLocalAuth: () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    },

    // 检查是否已登录
    isAuthenticated: () => {
        const token = sessionStorage.getItem('token');
        return !!token;
    },

    // 获取当前用户信息（从当前标签页的 sessionStorage）
    getCurrentUser: (): UserInfo | null => {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
        return null;
    },
};

export const userApi = {
    profile: () => api.get<ApiResponse<UserRecord>>('/users/me/profile').then(unwrap),
    updateProfile: (data: ProfileUpdateRequest) =>
        api.patch<ApiResponse<UserRecord>>('/users/me/profile', data).then(unwrap),
    uploadAvatar: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<ApiResponse<UserRecord>>('/users/me/avatar', formData).then(unwrap);
    },
    updatePassword: (data: PasswordUpdateRequest) =>
        api.patch<ApiResponse<void>>('/users/me/password', data).then(unwrap),
    list: (role?: string, studioStatus?: string) =>
        api.get<ApiResponse<UserRecord[]>>('/users', {params: {role, studioStatus}}).then(unwrap),
    get: (id: number) => api.get<ApiResponse<UserInfo>>(`/users/${id}`).then(unwrap),
    create: (data: CreateUserRequest) =>
        api.post<ApiResponse<UserRecord>>('/users', data).then(unwrap),
    updateRole: (id: number, data: {role: string}) =>
        api.patch<ApiResponse<UserInfo>>(`/users/${id}/role`, data).then(unwrap),
    applyStudio: (data: StudioApplicationRequest) =>
        api.post<ApiResponse<UserInfo>>('/users/me/studio-application', data).then(unwrap),
    reviewStudio: (id: number, data: {studioStatus: 'APPROVED' | 'REJECTED'}) =>
        api.patch<ApiResponse<UserInfo>>(`/users/${id}/studio-application`, data).then(unwrap),
    updateStatus: (id: number, data: {enabled: boolean}) =>
        api.patch<ApiResponse<UserInfo>>(`/users/${id}/status`, data).then(unwrap),
};

export const contentApi = {
    listPublished: () => api.get<ApiResponse<Content[]>>('/contents/public').then(unwrap),
    listMine: () => api.get<ApiResponse<Content[]>>('/contents/mine').then(unwrap),
    create: (data: {
        title: string;
        description?: string;
        coverUrl?: string;
        type: string;
        genre: string;
    }) => api.post<ApiResponse<Content>>('/contents', data).then(unwrap),
    update: (contentId: number, data: {
        title: string;
        description?: string;
        coverUrl?: string;
        genre: string;
    }) => api.patch<ApiResponse<Content>>(`/contents/${contentId}`, data).then(unwrap),
    submitForReview: (contentId: number) =>
        api.patch<ApiResponse<Content>>(`/contents/${contentId}/submit`).then(unwrap),
    listReviewQueue: () =>
        api.get<ApiResponse<Content[]>>('/contents/review-queue').then(unwrap),
    review: (contentId: number, data: {
        status: 'APPROVED' | 'REJECTED';
        reviewComment?: string;
    }) => api.patch<ApiResponse<Content>>(`/contents/${contentId}/review`, data).then(unwrap),
    publish: (contentId: number) =>
        api.patch<ApiResponse<Content>>(`/contents/${contentId}/publish`).then(unwrap),
    addSeason: (contentId: number, data: {seasonNumber: number; title: string; sortOrder?: number}) =>
        api.post(`/contents/${contentId}/seasons`, data).then(unwrap),
    addEpisode: (contentId: number, data: {
        seasonId?: number;
        episodeNumber: number;
        title: string;
        videoUrl: string;
        originalFileName?: string;
        fileSize?: number;
        durationSeconds: number;
        sortOrder?: number;
    }) => api.post(`/contents/${contentId}/episodes`, data).then(unwrap),
};

export const contentEngagementApi = {
    listComments: (contentId: number): Promise<ContentComment[]> =>
        api.get<ApiResponse<ContentComment[]>>(`/contents/${contentId}/comments`).then(unwrap),

    createComment: (contentId: number, data: CommentRequest): Promise<ContentComment> =>
        api.post<ApiResponse<ContentComment>>(`/contents/${contentId}/comments`, data).then(unwrap),

    toggleLike: (contentId: number, commentId: number, data: CommentLikeRequest): Promise<ContentComment> =>
        api.post<ApiResponse<ContentComment>>(`/contents/${contentId}/comments/${commentId}/like`, data).then(unwrap),

    deleteComment: (contentId: number, commentId: number): Promise<void> =>
        api.delete<ApiResponse<void>>(`/contents/${contentId}/comments/${commentId}`).then(unwrap),

    getRating: (contentId: number): Promise<ContentRatingSummary> =>
        api.get<ApiResponse<ContentRatingSummary>>(`/contents/${contentId}/rating`).then(unwrap),

    rate: (contentId: number, data: ContentRatingRequest): Promise<ContentRatingSummary> =>
        api.post<ApiResponse<ContentRatingSummary>>(`/contents/${contentId}/rating`, data).then(unwrap),

    recommendations: (contentId: number): Promise<Content[]> =>
        api.get<ApiResponse<Content[]>>(`/contents/${contentId}/recommendations`).then(unwrap),
};

const uploadMedia = (
    path: string,
    file: File,
    onProgress?: (percent: number, event: AxiosProgressEvent) => void,
    signal?: AbortSignal,
) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<MediaUploadResult>>(path, formData, {
        timeout: 0,
        signal,
        onUploadProgress: (event) => {
            const total = event.total ?? file.size;
            const percent = total > 0 ? Math.min(100, Math.round((event.loaded / total) * 100)) : 0;
            onProgress?.(percent, event);
        },
    }).then(unwrap);
};

export const mediaApi = {
    uploadCover: (
        file: File,
        onProgress?: (percent: number, event: AxiosProgressEvent) => void,
        signal?: AbortSignal,
    ) => uploadMedia('/media/covers', file, onProgress, signal),
    uploadVideo: (
        file: File,
        onProgress?: (percent: number, event: AxiosProgressEvent) => void,
        signal?: AbortSignal,
    ) => uploadMedia('/media/videos', file, onProgress, signal),
};

export default api;
