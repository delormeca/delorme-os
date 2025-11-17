/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { app__controllers__apify_crawler__CrawlStatusResponse } from '../models/app__controllers__apify_crawler__CrawlStatusResponse';
import type { CrawlControlResponse } from '../models/CrawlControlResponse';
import type { CrawlProcessResponse } from '../models/CrawlProcessResponse';
import type { CrawlStartRequest } from '../models/CrawlStartRequest';
import type { CrawlStartResponse } from '../models/CrawlStartResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ApifyCrawlerService {
    /**
     * Start Crawl
     * **START a new Apify crawl (MANUAL TRIGGER).**
     *
     * This endpoint allows users to manually trigger a crawl for a client.
     * The crawl runs asynchronously in Apify's cloud infrastructure.
     *
     * **Features:**
     * - Manual start control
     * - Customizable crawl depth
     * - Optional HTML/Markdown/Screenshots
     * - Returns immediately with crawl run ID for status monitoring
     *
     * **Usage:**
     * 1. Call this endpoint to start crawl
     * 2. Use the returned `id` to monitor status via `/status` endpoint
     * 3. Stop or pause anytime using control endpoints
     * @param clientId
     * @param requestBody
     * @returns CrawlStartResponse Successful Response
     * @throws ApiError
     */
    public static startCrawlApiClientsClientIdCrawlStartPost(
        clientId: string,
        requestBody: CrawlStartRequest,
    ): CancelablePromise<CrawlStartResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/clients/{client_id}/crawl/start',
            path: {
                'client_id': clientId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Stop Crawl
     * **STOP/ABORT a running crawl immediately.**
     *
     * This endpoint allows users to forcefully stop a running crawl.
     * The crawl is aborted immediately in Apify's infrastructure.
     *
     * **Features:**
     * - Immediate abort
     * - Stops consuming Apify compute units
     * - Partial results may be available for processing
     *
     * **Usage:**
     * Call this endpoint with the crawl run ID to immediately stop the crawl.
     * @param crawlRunId
     * @returns CrawlControlResponse Successful Response
     * @throws ApiError
     */
    public static stopCrawlApiCrawlCrawlRunIdStopPost(
        crawlRunId: string,
    ): CancelablePromise<CrawlControlResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/crawl/{crawl_run_id}/stop',
            path: {
                'crawl_run_id': crawlRunId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Pause Crawl
     * **PAUSE a running crawl gracefully.**
     *
     * This endpoint allows users to pause a running crawl.
     * Note: Apify doesn't support native pause/resume, so this performs a graceful stop.
     * To resume, you would need to start a new crawl with remaining URLs.
     *
     * **Features:**
     * - Graceful stop
     * - Partial results available for processing
     *
     * **Usage:**
     * Call this endpoint with the crawl run ID to pause the crawl.
     * @param crawlRunId
     * @returns CrawlControlResponse Successful Response
     * @throws ApiError
     */
    public static pauseCrawlApiCrawlCrawlRunIdPausePost(
        crawlRunId: string,
    ): CancelablePromise<CrawlControlResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/crawl/{crawl_run_id}/pause',
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
     * **Get real-time status of a crawl run.**
     *
     * This endpoint provides live status monitoring for a crawl.
     * It fetches the latest status from Apify and updates the local database.
     *
     * **Status Values:**
     * - `READY`: Crawl is queued but not started
     * - `RUNNING`: Crawl is actively running
     * - `SUCCEEDED`: Crawl completed successfully
     * - `FAILED`: Crawl failed with errors
     * - `ABORTED`: Crawl was manually stopped
     * - `TIMED-OUT`: Crawl exceeded timeout
     *
     * **Usage:**
     * Poll this endpoint to monitor crawl progress. Recommended interval: 5-10 seconds.
     * @param crawlRunId
     * @returns app__controllers__apify_crawler__CrawlStatusResponse Successful Response
     * @throws ApiError
     */
    public static getCrawlStatusApiCrawlCrawlRunIdStatusGet(
        crawlRunId: string,
    ): CancelablePromise<app__controllers__apify_crawler__CrawlStatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/crawl/{crawl_run_id}/status',
            path: {
                'crawl_run_id': crawlRunId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Process Crawl Results
     * **Process completed crawl results.**
     *
     * This endpoint fetches results from Apify, generates embeddings, and calculates similarity.
     * Call this after a crawl completes (status = SUCCEEDED).
     *
     * **Processing Steps:**
     * 1. Fetch all crawled pages from Apify dataset
     * 2. Create ClientPageVersion records with all 83 data columns
     * 3. Generate 3 OpenAI embeddings per page (raw_text, page_title, slug)
     * 4. Calculate cosine similarity for "similar to" recommendations
     *
     * **Features:**
     * - Automatic embedding generation (optional)
     * - Similarity calculations (optional)
     * - Historical versioning
     *
     * **Usage:**
     * Call this endpoint after crawl completes to persist and process all results.
     * @param crawlRunId
     * @param generateEmbeddings
     * @param calculateSimilarity
     * @returns CrawlProcessResponse Successful Response
     * @throws ApiError
     */
    public static processCrawlResultsApiCrawlCrawlRunIdProcessPost(
        crawlRunId: string,
        generateEmbeddings: boolean = true,
        calculateSimilarity: boolean = true,
    ): CancelablePromise<CrawlProcessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/crawl/{crawl_run_id}/process',
            path: {
                'crawl_run_id': crawlRunId,
            },
            query: {
                'generate_embeddings': generateEmbeddings,
                'calculate_similarity': calculateSimilarity,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Client Crawls
     * **Get all crawl runs for a client.**
     *
     * Returns a list of all crawl runs for the specified client,
     * ordered by most recent first.
     *
     * **Usage:**
     * Use this to display crawl history in the UI.
     * @param clientId
     * @param limit
     * @returns app__controllers__apify_crawler__CrawlStatusResponse Successful Response
     * @throws ApiError
     */
    public static getClientCrawlsApiClientsClientIdCrawlsGet(
        clientId: string,
        limit: number = 10,
    ): CancelablePromise<Array<app__controllers__apify_crawler__CrawlStatusResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/clients/{client_id}/crawls',
            path: {
                'client_id': clientId,
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
