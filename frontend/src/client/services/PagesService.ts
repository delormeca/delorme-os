/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PageCreate } from '../models/PageCreate';
import type { PageDataRead } from '../models/PageDataRead';
import type { PageRead } from '../models/PageRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PagesService {
    /**
     * Get Project Pages
     * Get all pages for a project.
     * @param projectId
     * @returns PageRead Successful Response
     * @throws ApiError
     */
    public static getProjectPagesApiProjectsProjectIdPagesGet(
        projectId: string,
    ): CancelablePromise<Array<PageRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/projects/{project_id}/pages',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Page
     * Get a page by ID.
     * @param pageId
     * @returns PageRead Successful Response
     * @throws ApiError
     */
    public static getPageApiPagesPageIdGet(
        pageId: string,
    ): CancelablePromise<PageRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/pages/{page_id}',
            path: {
                'page_id': pageId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Page
     * Create a new page.
     * @param requestBody
     * @returns PageRead Successful Response
     * @throws ApiError
     */
    public static createPageApiPagesPost(
        requestBody: PageCreate,
    ): CancelablePromise<PageRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/pages',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Page Data
     * Get all data for a page.
     * @param pageId
     * @returns PageDataRead Successful Response
     * @throws ApiError
     */
    public static getPageDataApiPagesPageIdDataGet(
        pageId: string,
    ): CancelablePromise<Array<PageDataRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/pages/{page_id}/data',
            path: {
                'page_id': pageId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
