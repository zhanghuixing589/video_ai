export type Role = 'USER' | 'STUDIO' | 'REVIEWER' | 'ADMIN';
export type StudioStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type ContentType = 'MOVIE' | 'TV_SERIES' | 'VARIETY';
export type VideoGenre = 'ACTION' | 'ROMANCE' | 'COMEDY' | 'SUSPENSE' | 'SCI_FI'
    | 'DOCUMENTARY' | 'ANIMATION' | 'FAMILY' | 'REALITY' | 'OTHER';
export type VideoStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'BANNED';

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface UserInfo {
    id: number;
    username: string;
    email: string;
    displayName: string;
    role: Role;
    studioStatus: StudioStatus;
    studioName?: string;
}

export interface UserRecord extends UserInfo {
    studioDescription?: string;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: UserInfo;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    role: 'USER' | 'STUDIO';
}

export interface StudioApplicationRequest {
    studioName: string;
    studioDescription?: string;
}

export interface CreateUserRequest {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    role: Role;
}

export interface Video {
    id: number;
    title: string;
    description?: string;
    url: string;
    duration: number;
    coverUrl?: string;
    type: ContentType;
    genre: VideoGenre;
    status: VideoStatus;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    rating: number;
    createdBy: number;
    reviewedBy?: number;
    reviewedAt?: string;
    reviewComment?: string;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateVideoRequest {
    title: string;
    description?: string;
    url: string;
    duration: number;
    coverUrl?: string;
    type: ContentType;
    genre: VideoGenre;
    createdBy: number;
}

export interface ReviewVideoRequest {
    reviewerId: number;
    status: 'APPROVED' | 'REJECTED';
    reviewComment?: string;
}

export interface Episode {
    id: number;
    episodeNumber: number;
    title: string;
    videoUrl: string;
    durationSeconds: number;
    previewSeconds: number;
    sortOrder: number;
    publishedAt?: string;
}

export interface Season {
    id: number;
    seasonNumber: number;
    title: string;
    sortOrder: number;
    episodes: Episode[];
}

export interface Content {
    id: number;
    title: string;
    description?: string;
    coverUrl?: string;
    type: ContentType;
    genre: string;
    status: string;
    studioId: number;
    seasons: Season[];
    episodes: Episode[];
}
