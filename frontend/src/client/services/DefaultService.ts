/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Health Check
     * Health check endpoint for monitoring and testing
     * @returns any Successful Response
     * @throws ApiError
     */
    public static healthCheckHealthGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
        });
    }
    /**
     * Read Robots
     * @returns any Successful Response
     * @throws ApiError
     */
    public static readRobotsRobotsTxtGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/robots.txt',
        });
    }
    /**
     * Read Sitemap
     * @returns any Successful Response
     * @throws ApiError
     */
    public static readSitemapSitemapXmlGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sitemap.xml',
        });
    }
    /**
     * Catch All
     * @param fullPath
     * @returns string Successful Response
     * @throws ApiError
     */
    public static catchAllFullPathGet(
        fullPath: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/{full_path}',
            path: {
                'full_path': fullPath,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
