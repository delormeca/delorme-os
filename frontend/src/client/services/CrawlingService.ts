/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddManualPageRequest } from '../models/AddManualPageRequest';
import type { AddManualPageResponse } from '../models/AddManualPageResponse';
import type { app__schemas__crawling__StartCrawlRequest } from '../models/app__schemas__crawling__StartCrawlRequest';
import type { CancelCrawlJobRequest } from '../models/CancelCrawlJobRequest';
import type { CancelCrawlJobResponse } from '../models/CancelCrawlJobResponse';
import type { CrawlJobStatusResponse } from '../models/CrawlJobStatusResponse';
import type { PageDetailResponse } from '../models/PageDetailResponse';
import type { PageWithStatsResponse } from '../models/PageWithStatsResponse';
import type { RescanSitemapRequest } from '../models/RescanSitemapRequest';
import type { RescanSitemapResponse } from '../models/RescanSitemapResponse';
import type { ScrapeSelectedPagesRequest } from '../models/ScrapeSelectedPagesRequest';
import type { ScrapeSelectedPagesResponse } from '../models/ScrapeSelectedPagesResponse';
import type { StartCrawlResponse } from '../models/StartCrawlResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CrawlingService {
    /**
     * Start Crawl Job
     * Start a new crawl job for a project.
     *
     * This endpoint initiates a background crawl job that will:
     * 1. Discover URLs from sitemap or crawling
     * 2. Test multiple extraction methods
     * 3. Extract content from all pages using the best method
     *
     * Args:
     * request: Request containing project_id
     * current_user: Authenticated user
     * db: Database session
     *
     * Returns:
     * StartCrawlResponse with job details
     * @param requestBody
     * @returns StartCrawlResponse Successful Response
     * @throws ApiError
     */
    public static startCrawlJobApiCrawlStartPost(
        requestBody: app__schemas__crawling__StartCrawlRequest,
    ): CancelablePromise<StartCrawlResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/crawl/start',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Crawl Job Status
     * Get the status of a crawl job.
     *
     * Args:
     * crawl_job_id: The crawl job ID
     * current_user: Authenticated user
     * db: Database session
     *
     * Returns:
     * CrawlJobStatusResponse with job status
     * @param crawlJobId
     * @returns CrawlJobStatusResponse Successful Response
     * @throws ApiError
     */
    public static getCrawlJobStatusApiCrawlStatusCrawlJobIdGet(
        crawlJobId: string,
    ): CancelablePromise<CrawlJobStatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/crawl/status/{crawl_job_id}',
            path: {
                'crawl_job_id': crawlJobId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Manual Page
     * Manually add a page URL to a project.
     *
     * Args:
     * request: Request containing project_id and URL
     * current_user: Authenticated user
     * db: Database session
     *
     * Returns:
     * AddManualPageResponse with page details
     * @param requestBody
     * @returns AddManualPageResponse Successful Response
     * @throws ApiError
     */
    public static addManualPageApiCrawlManualPagePost(
        requestBody: AddManualPageRequest,
    ): CancelablePromise<AddManualPageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/crawl/manual-page',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Project Pages
     * Get all pages for a project.
     *
     * Args:
     * project_id: The project ID
     * current_user: Authenticated user
     * db: Database session
     *
     * Returns:
     * List of PageDetailResponse
     * @param projectId
     * @returns PageDetailResponse Successful Response
     * @throws ApiError
     */
    public static getProjectPagesApiCrawlProjectProjectIdPagesGet(
        projectId: string,
    ): CancelablePromise<Array<PageDetailResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/crawl/project/{project_id}/pages',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Project Crawl Jobs
     * Get all crawl jobs for a project.
     *
     * Args:
     * project_id: The project ID
     * current_user: Authenticated user
     * db: Database session
     *
     * Returns:
     * List of CrawlJobStatusResponse
     * @param projectId
     * @returns CrawlJobStatusResponse Successful Response
     * @throws ApiError
     */
    public static getProjectCrawlJobsApiCrawlProjectProjectIdCrawlJobsGet(
        projectId: string,
    ): CancelablePromise<Array<CrawlJobStatusResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/crawl/project/{project_id}/crawl-jobs',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cancel Crawl Job Endpoint
     * Cancel a running crawl job.
     *
     * Args:
     * request: Request containing crawl_job_id
     * current_user: Authenticated user
     * db: Database session
     *
     * Returns:
     * CancelCrawlJobResponse with cancellation result
     * @param requestBody
     * @returns CancelCrawlJobResponse Successful Response
     * @throws ApiError
     */
    public static cancelCrawlJobEndpointApiCrawlCancelPost(
        requestBody: CancelCrawlJobRequest,
    ): CancelablePromise<CancelCrawlJobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/crawl/cancel',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Rescan Sitemap
     * Re-scan sitemap and detect changes.
     *
     * Compares current sitemap with existing pages and returns:
     * - New URLs discovered
     * - URLs removed from sitemap
     * - Unchanged URLs
     *
     * Args:
     * request: Request containing project_id
     * current_user: Authenticated user
     * db: Database session
     *
     * Returns:
     * RescanSitemapResponse with diff results
     * @param requestBody
     * @returns RescanSitemapResponse Successful Response
     * @throws ApiError
     */
    public static rescanSitemapApiCrawlRescanSitemapPost(
        requestBody: RescanSitemapRequest,
    ): CancelablePromise<RescanSitemapResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/crawl/rescan-sitemap',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Scrape Selected Pages
     * Scrape selected pages using specified extraction method.
     *
     * Args:
     * request: Request containing page_ids and extraction_method
     * current_user: Authenticated user
     * db: Database session
     *
     * Returns:
     * ScrapeSelectedPagesResponse with scraping results
     * @param requestBody
     * @returns ScrapeSelectedPagesResponse Successful Response
     * @throws ApiError
     */
    public static scrapeSelectedPagesApiCrawlScrapeSelectedPost(
        requestBody: ScrapeSelectedPagesRequest,
    ): CancelablePromise<ScrapeSelectedPagesResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/crawl/scrape-selected',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Project Pages With Stats
     * Get all pages for a project with crawl statistics.
     *
     * Includes current page data, version count, and crawl status.
     *
     * Args:
     * project_id: The project ID
     * current_user: Authenticated user
     * db: Database session
     *
     * Returns:
     * List of PageWithStatsResponse
     * @param projectId
     * @returns PageWithStatsResponse Successful Response
     * @throws ApiError
     */
    public static getProjectPagesWithStatsApiCrawlProjectProjectIdPagesWithStatsGet(
        projectId: string,
    ): CancelablePromise<Array<PageWithStatsResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/crawl/project/{project_id}/pages-with-stats',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
