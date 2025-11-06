/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClientPageCreate } from '../models/ClientPageCreate';
import type { ClientPageList } from '../models/ClientPageList';
import type { ClientPageRead } from '../models/ClientPageRead';
import type { ClientPageUpdate } from '../models/ClientPageUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ClientPagesService {
    /**
     * Create Page
     * Create a new client page.
     * @param requestBody
     * @returns ClientPageRead Successful Response
     * @throws ApiError
     */
    public static createPageApiClientPagesPost(
        requestBody: ClientPageCreate,
    ): CancelablePromise<ClientPageRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/client-pages',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Pages
     * List client pages with filtering, search, and pagination.
     *
     * Supports:
     * - Filtering by client, failed status, and HTTP status code
     * - Text search in URL and slug
     * - Pagination
     * - Sorting
     * @param clientId Filter by client ID
     * @param isFailed Filter by failed status
     * @param statusCode Filter by HTTP status code
     * @param search Search in URL or slug
     * @param page Page number
     * @param pageSize Items per page
     * @param sortBy Field to sort by
     * @param sortOrder Sort order (asc/desc)
     * @returns ClientPageList Successful Response
     * @throws ApiError
     */
    public static listPagesApiClientPagesGet(
        clientId: string,
        isFailed?: boolean,
        statusCode?: number,
        search?: string,
        page: number = 1,
        pageSize: number = 50,
        sortBy: string = 'created_at',
        sortOrder: string = 'desc',
    ): CancelablePromise<ClientPageList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/client-pages',
            query: {
                'client_id': clientId,
                'is_failed': isFailed,
                'status_code': statusCode,
                'search': search,
                'page': page,
                'page_size': pageSize,
                'sort_by': sortBy,
                'sort_order': sortOrder,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Page
     * Get a specific client page by ID.
     * @param pageId
     * @returns ClientPageRead Successful Response
     * @throws ApiError
     */
    public static getPageApiClientPagesPageIdGet(
        pageId: string,
    ): CancelablePromise<ClientPageRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/client-pages/{page_id}',
            path: {
                'page_id': pageId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Page
     * Update a client page.
     * @param pageId
     * @param requestBody
     * @returns ClientPageRead Successful Response
     * @throws ApiError
     */
    public static updatePageApiClientPagesPageIdPut(
        pageId: string,
        requestBody: ClientPageUpdate,
    ): CancelablePromise<ClientPageRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/client-pages/{page_id}',
            path: {
                'page_id': pageId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Page
     * Delete a client page.
     * @param pageId
     * @returns void
     * @throws ApiError
     */
    public static deletePageApiClientPagesPageIdDelete(
        pageId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/client-pages/{page_id}',
            path: {
                'page_id': pageId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Client Page Count
     * Get total and failed page counts for a client.
     * @param clientId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getClientPageCountApiClientPagesClientClientIdCountGet(
        clientId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/client-pages/client/{client_id}/count',
            path: {
                'client_id': clientId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete All Client Pages
     * Delete all pages for a client (useful for resetting engine setup).
     * @param clientId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteAllClientPagesApiClientPagesClientClientIdAllDelete(
        clientId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/client-pages/client/{client_id}/all',
            path: {
                'client_id': clientId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
