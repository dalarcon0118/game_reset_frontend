/**
 * Global API Types and Interfaces
 */

export type ApiErrorType =
    | 'ValidationError'
    | 'AuthenticationError'
    | 'PermissionDenied'
    | 'NotFoundError'
    | 'ServerError'
    | 'NetworkError'
    | 'AbortError'
    | 'UnknownError';

export interface ApiResponse<T> {
    data: T;
    status: number;
    headers: Record<string, string>;
}

export interface ApiErrorResponse {
    error_type: ApiErrorType;
    message: string;
    context?: any;
    status_code: number;
}

/**
 * Common Model Types
 */

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string | null;
    structure: any | null;
}
