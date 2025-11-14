/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AllTagsResponse } from '../models/AllTagsResponse';
import type { BulkUpdateTagsRequest } from '../models/BulkUpdateTagsRequest';
import type { BulkUpdateTagsResponse } from '../models/BulkUpdateTagsResponse';
import type { ClientPageRead } from '../models/ClientPageRead';
import type { UpdateTagsRequest } from '../models/UpdateTagsRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TagsService {
    /**
     * Update Page Tags
     * Update tags for a specific page.
     *
     * Replaces existing tags with the provided array.
     * @param pageId
     * @param requestBody
     * @returns ClientPageRead Successful Response
     * @throws ApiError
     */
    public static updatePageTagsApiTagsPageIdPut(
        pageId: string,
        requestBody: UpdateTagsRequest,
    ): CancelablePromise<ClientPageRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/tags/{page_id}',
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
     * Delete Page Tags
     * Remove all tags from a specific page.
     *
     * Sets the tags field to an empty array.
     * @param pageId
     * @returns ClientPageRead Successful Response
     * @throws ApiError
     */
    public static deletePageTagsApiTagsPageIdDelete(
        pageId: string,
    ): CancelablePromise<ClientPageRead> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/tags/{page_id}',
            path: {
                'page_id': pageId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Bulk Update Tags
     * Update tags for multiple pages at once.
     *
     * Supports two modes:
     * - 'replace': Replace all existing tags with the new tags
     * - 'append': Add new tags to existing tags (no duplicates)
     * @param requestBody
     * @returns BulkUpdateTagsResponse Successful Response
     * @throws ApiError
     */
    public static bulkUpdateTagsApiTagsBulkUpdatePost(
        requestBody: BulkUpdateTagsRequest,
    ): CancelablePromise<BulkUpdateTagsResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/tags/bulk-update',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get All Client Tags
     * Get all unique tags used across all pages for a specific client.
     *
     * Returns a sorted list of unique tags and the total count.
     * Useful for:
     * - Tag autocomplete/suggestions
     * - Tag filtering dropdowns
     * - Tag analytics
     * @param clientId
     * @returns AllTagsResponse Successful Response
     * @throws ApiError
     */
    public static getAllClientTagsApiTagsClientClientIdAllTagsGet(
        clientId: string,
    ): CancelablePromise<AllTagsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/tags/client/{client_id}/all-tags',
            path: {
                'client_id': clientId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
