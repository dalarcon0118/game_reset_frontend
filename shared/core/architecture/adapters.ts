
import { AppKernel } from './kernel';
import { DataProvider, ListParams } from './interfaces';

/**
 * Default Implementation of DataProvider using the existing API Client
 * This bridges the new architecture with the legacy ApiClient
 */
import apiClient from '@/shared/services/api_client';

export const restDataProvider: DataProvider = {
    getList: async <T>(resource: string, params?: ListParams) => {
        const queryParams: any = {};
        
        if (params?.pagination) {
            queryParams.page = params.pagination.current;
            queryParams.limit = params.pagination.pageSize;
        }

        // Mapping filters and sorters would go here
        
        const response = await apiClient.get(`/${resource}`, queryParams);
        return {
            data: response.data,
            total: response.meta?.total || response.data.length
        };
    },

    getOne: async <T>(resource: string, id: string | number) => {
        const response = await apiClient.get(`/${resource}/${id}`);
        return response.data;
    },

    create: async <T>(resource: string, variables: any) => {
        const response = await apiClient.post(`/${resource}`, variables);
        return response.data;
    },

    update: async <T>(resource: string, id: string | number, variables: any) => {
        const response = await apiClient.put(`/${resource}/${id}`, variables);
        return response.data;
    },

    delete: async <T>(resource: string, id: string | number) => {
        const response = await apiClient.delete(`/${resource}/${id}`);
        return response.data;
    },
    
    custom: async <T>(params) => {
        const { url, method, payload, headers } = params;
        // @ts-ignore - apiClient methods need to be accessed dynamically or typed better
        return apiClient[method](url, payload, { headers });
    }
};
