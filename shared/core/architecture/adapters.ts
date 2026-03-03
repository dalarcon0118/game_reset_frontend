
import { AppKernel } from './kernel';
import { DataProvider, ListParams, CustomParams } from './interfaces';
import apiClient from '../../services/api_client/api_client';

/**
 * REST Data Provider Implementation
 * Adapts the generic DataProvider interface to our specific REST API client.
 */
export const restDataProvider: DataProvider = {
    getList: async <T>(resource: string, params?: ListParams) => {
        const queryParams: any = {};

        if (params?.pagination) {
            queryParams.page = params.pagination.current;
            queryParams.limit = params.pagination.pageSize;
        }

        if (params?.filters) {
            params.filters.forEach(filter => {
                queryParams[filter.field] = filter.value;
            });
        }

        if (params?.sorters && params.sorters.length > 0) {
            const sorter = params.sorters[0];
            queryParams._sort = sorter.field;
            queryParams._order = sorter.order;
        }

        // Look up resource definition to get the correct endpoint if mapped
        const resourceDef = AppKernel.getResource(resource);
        const endpoint = resourceDef?.list || `/${resource}`;

        const response = await apiClient.get(endpoint, queryParams) as any;

        // Normalize response
        return {
            data: response.data,
            total: response.meta?.total || response.data?.length || 0
        };
    },

    getOne: async <T>(resource: string, id: string | number) => {
        const resourceDef = AppKernel.getResource(resource);
        // Replace :id parameter if present in route definition, otherwise append
        let endpoint = resourceDef?.show || `/${resource}/${id}`;
        if (endpoint.includes(':id')) {
            endpoint = endpoint.replace(':id', String(id));
        }

        const response = await apiClient.get(endpoint) as any;
        return response.data;
    },

    create: async <T>(resource: string, variables: any) => {
        const resourceDef = AppKernel.getResource(resource);
        const endpoint = resourceDef?.create || `/${resource}`;

        const response = await apiClient.post(endpoint, variables) as any;
        return response.data;
    },

    update: async <T>(resource: string, id: string | number, variables: any) => {
        const resourceDef = AppKernel.getResource(resource);
        let endpoint = resourceDef?.edit || `/${resource}/${id}`;
        if (endpoint.includes(':id')) {
            endpoint = endpoint.replace(':id', String(id));
        }

        const response = await apiClient.put(endpoint, variables) as any;
        return response.data;
    },

    delete: async <T>(resource: string, id: string | number) => {
        const resourceDef = AppKernel.getResource(resource);
        const endpoint = `/${resource}/${id}`; // Delete usually follows standard convention

        const response = await apiClient.delete(endpoint) as any;
        return response.data;
    },

    custom: async <T>(params: CustomParams) => {
        const { url, method, payload, headers } = params;
        // @ts-ignore - Dynamic access to client methods
        return apiClient[method](url, payload, { headers });
    }
};


