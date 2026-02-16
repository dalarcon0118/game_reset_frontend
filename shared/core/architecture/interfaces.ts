
/**
 * Standardized Data Provider Interface
 * Inspired by Refine.dev but adapted for TEA/FP
 */
export interface DataProvider {
    getList: <T>(resource: string, params?: ListParams) => Promise<ListResponse<T>>;
    getOne: <T>(resource: string, id: string | number) => Promise<T>;
    create: <T>(resource: string, variables: any) => Promise<T>;
    update: <T>(resource: string, id: string | number, variables: any) => Promise<T>;
    delete: <T>(resource: string, id: string | number) => Promise<T>;
    custom?: <T>(params: CustomParams) => Promise<T>;
}

export interface ListParams {
    pagination?: { current: number; pageSize: number };
    sorters?: { field: string; order: 'asc' | 'desc' }[];
    filters?: { field: string; operator: string; value: any }[];
}

export interface ListResponse<T> {
    data: T[];
    total: number;
}

export interface CustomParams {
    url: string;
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
    payload?: any;
    headers?: Record<string, string>;
}

/**
 * Standardized Auth Provider Interface
 */
export interface AuthProvider {
    login: (params: any) => Promise<any>;
    logout: () => Promise<void>;
    checkError: (error: any) => Promise<void>;
    checkAuth: () => Promise<void>;
    getPermissions: () => Promise<any>;
    getUserIdentity: () => Promise<any>;
}

/**
 * Standardized Notification Provider
 */
export interface NotificationProvider {
    open: (params: NotificationParams) => void;
    close: (key: string) => void;
}

export interface NotificationParams {
    key?: string;
    message: string;
    description?: string;
    type: 'success' | 'error' | 'progress';
    duration?: number;
}

/**
 * Resource Definition
 */
export interface ResourceDefinition {
    name: string;
    list?: string;
    create?: string;
    edit?: string;
    show?: string;
    meta?: Record<string, any>;
}
