import axios, {type AxiosResponse} from 'axios';
import type {
    ApiResponse,
    Content,
    ContentType,
    CreateUserRequest,
    CreateVideoRequest,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    StudioApplicationRequest,
    UserInfo,
    UserRecord,
    Video,
    VideoGenre,
    ReviewVideoRequest,
} from '../type/api';
import {clearAuthSession} from './authSession';

const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
            clearAuthSession();
        }
        return Promise.reject(error);
    },
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
    logout: clearAuthSession,
};

export const userApi = {
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
    addSeason: (contentId: number, data: {seasonNumber: number; title: string; sortOrder?: number}) =>
        api.post(`/contents/${contentId}/seasons`, data).then(unwrap),
    addEpisode: (contentId: number, data: {
        seasonId?: number;
        episodeNumber: number;
        title: string;
        videoUrl: string;
        durationSeconds: number;
        sortOrder?: number;
    }) => api.post(`/contents/${contentId}/episodes`, data).then(unwrap),
};

export const videoApi = {
    create: (data: CreateVideoRequest) =>
        api.post<ApiResponse<Video>>('/videos', data).then(unwrap),
    listPublished: (params?: {type?: ContentType; genre?: VideoGenre; keyword?: string}) =>
        api.get<ApiResponse<Video[]>>('/videos/public', {params}).then(unwrap),
    listByStudio: (studioId: number) =>
        api.get<ApiResponse<Video[]>>(`/videos/studio/${studioId}`).then(unwrap),
    listReviewQueue: () =>
        api.get<ApiResponse<Video[]>>('/videos/review-queue').then(unwrap),
    get: (id: number) =>
        api.get<ApiResponse<Video>>(`/videos/${id}`).then(unwrap),
    review: (id: number, data: ReviewVideoRequest) =>
        api.patch<ApiResponse<Video>>(`/videos/${id}/review`, data).then(unwrap),
    publish: (id: number) =>
        api.patch<ApiResponse<Video>>(`/videos/${id}/publish`).then(unwrap),
};

export default api;
