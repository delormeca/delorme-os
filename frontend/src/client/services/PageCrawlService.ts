/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CrawlStatusResponse } from '../models/CrawlStatusResponse';
import type { JobResponse } from '../models/JobResponse';
import type { StartCrawlRequest } from '../models/StartCrawlRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PageCrawlService {
    /**
     * Start Crawl
     * Start a new page crawl job.
     *
     * This will:
     * 1. Create a new CrawlRun record
     * 2. Schedule a background job to crawl pages
     * 3. Extract all 22 data points from each page
     * 4. Update database with results
     *
     * The crawl runs asynchronously in the background.
     * Use the GET /status endpoint to track progress.
     * @param requestBody
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static startCrawlApiPageCrawlStartPost(
        requestBody: StartCrawlRequest,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/page-crawl/start',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Start Crawl
     * Start a new page crawl job.
     *
     * This will:
     * 1. Create a new CrawlRun record
     * 2. Schedule a background job to crawl pages
     * 3. Extract all 22 data points from each page
     * 4. Update database with results
     *
     * The crawl runs asynchronously in the background.
     * Use the GET /status endpoint to track progress.
     * @param requestBody
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static startCrawlApiPageCrawlStartPost1(
        requestBody: StartCrawlRequest,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/page-crawl/start',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Crawl Status
     * Get the current status of a crawl run.
     *
     * Returns real-time progress information including:
     * - Progress percentage
     * - Current page being crawled
     * - Success/failure counts
     * - Performance metrics
     * - Error log
     * @param crawlRunId
     * @returns CrawlStatusResponse Successful Response
     * @throws ApiError
     */
    public static getCrawlStatusApiPageCrawlStatusCrawlRunIdGet(
        crawlRunId: string,
    ): CancelablePromise<CrawlStatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/page-crawl/status/{crawl_run_id}',
            path: {
                'crawl_run_id': crawlRunId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Crawl Status
     * Get the current status of a crawl run.
     *
     * Returns real-time progress information including:
     * - Progress percentage
     * - Current page being crawled
     * - Success/failure counts
     * - Performance metrics
     * - Error log
     * @param crawlRunId
     * @returns CrawlStatusResponse Successful Response
     * @throws ApiError
     */
    public static getCrawlStatusApiPageCrawlStatusCrawlRunIdGet1(
        crawlRunId: string,
    ): CancelablePromise<CrawlStatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/page-crawl/status/{crawl_run_id}',
            path: {
                'crawl_run_id': crawlRunId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cancel Crawl
     * Cancel a running or scheduled crawl job.
     *
     * Note: This cancels the scheduled job. If the job is already running,
     * it will continue until the current page finishes.
     * @param jobId
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static cancelCrawlApiPageCrawlCancelJobIdPost(
        jobId: string,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/page-crawl/cancel/{job_id}',
            path: {
                'job_id': jobId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cancel Crawl
     * Cancel a running or scheduled crawl job.
     *
     * Note: This cancels the scheduled job. If the job is already running,
     * it will continue until the current page finishes.
     * @param jobId
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static cancelCrawlApiPageCrawlCancelJobIdPost1(
        jobId: string,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/page-crawl/cancel/{job_id}',
            path: {
                'job_id': jobId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Crawl Jobs
     * List all scheduled and running crawl jobs.
     *
     * Returns information about currently active jobs in the queue.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listCrawlJobsApiPageCrawlJobsGet(): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/page-crawl/jobs',
        });
    }
    /**
     * List Crawl Jobs
     * List all scheduled and running crawl jobs.
     *
     * Returns information about currently active jobs in the queue.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listCrawlJobsApiPageCrawlJobsGet1(): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/page-crawl/jobs',
        });
    }
    /**
     * List Client Crawl Runs
     * List recent crawl runs for a client (accepts UUID or slug).
     *
     * Returns the most recent crawl runs, ordered by creation date.
     * @param clientIdentifier
     * @param limit
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listClientCrawlRunsApiPageCrawlClientClientIdentifierRunsGet(
        clientIdentifier: string,
        limit: number = 10,
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/page-crawl/client/{client_identifier}/runs',
            path: {
                'client_identifier': clientIdentifier,
            },
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Client Crawl Runs
     * List recent crawl runs for a client (accepts UUID or slug).
     *
     * Returns the most recent crawl runs, ordered by creation date.
     * @param clientIdentifier
     * @param limit
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listClientCrawlRunsApiPageCrawlClientClientIdentifierRunsGet1(
        clientIdentifier: string,
        limit: number = 10,
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/page-crawl/client/{client_identifier}/runs',
            path: {
                'client_identifier': clientIdentifier,
            },
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
