/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClientRead } from '../models/ClientRead';
import type { RunComparisonRequest } from '../models/RunComparisonRequest';
import type { RunComparisonResponse } from '../models/RunComparisonResponse';
import type { SitemapChangeList } from '../models/SitemapChangeList';
import type { SitemapTrackerConfigUpdate } from '../models/SitemapTrackerConfigUpdate';
import type { SitemapTrackerDashboard } from '../models/SitemapTrackerDashboard';
import type { SitemapTrackerRunCreate } from '../models/SitemapTrackerRunCreate';
import type { SitemapTrackerRunList } from '../models/SitemapTrackerRunList';
import type { SitemapTrackerRunRead } from '../models/SitemapTrackerRunRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SitemapTrackerService {
    /**
     * Configure Tracker
     * Update sitemap tracker configuration for a client.
     *
     * This endpoint allows you to configure:
     * - Sitemap URL to track
     * - Tracking frequency (daily, weekly, bi_monthly, monthly, manual_only)
     * - Enable/disable tracking for the client
     * @param clientId ID of the client to configure
     * @param requestBody
     * @returns ClientRead Successful Response
     * @throws ApiError
     */
    public static configureTrackerApiSitemapTrackerClientsClientIdConfigurePost(
        clientId: string,
        requestBody: SitemapTrackerConfigUpdate,
    ): CancelablePromise<ClientRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sitemap-tracker/clients/{client_id}/configure',
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
     * Create Tracker Run
     * Start a new sitemap tracker run for a client.
     *
     * This creates a pending run record that can be executed using the
     * POST /runs/{run_id}/execute endpoint.
     *
     * Run types:
     * - manual: User-initiated run
     * - scheduled: Automatically scheduled run based on frequency
     * @param clientId ID of the client to create run for
     * @param requestBody
     * @returns SitemapTrackerRunRead Successful Response
     * @throws ApiError
     */
    public static createTrackerRunApiSitemapTrackerClientsClientIdRunsPost(
        clientId: string,
        requestBody: SitemapTrackerRunCreate,
    ): CancelablePromise<SitemapTrackerRunRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sitemap-tracker/clients/{client_id}/runs',
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
     * List Client Tracker Runs
     * List all tracker runs for a specific client (paginated).
     *
     * Returns runs in reverse chronological order (most recent first).
     * Use pagination parameters to control the number of results.
     * @param clientId ID of the client to list runs for
     * @param page Page number (starts at 1)
     * @param pageSize Number of items per page
     * @returns SitemapTrackerRunList Successful Response
     * @throws ApiError
     */
    public static listClientTrackerRunsApiSitemapTrackerClientsClientIdRunsGet(
        clientId: string,
        page: number = 1,
        pageSize: number = 20,
    ): CancelablePromise<SitemapTrackerRunList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sitemap-tracker/clients/{client_id}/runs',
            path: {
                'client_id': clientId,
            },
            query: {
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Execute Tracker Run
     * Execute a pending sitemap tracker run.
     *
     * This triggers the actual sitemap parsing, comparison with previous run,
     * and change detection. The run will be executed asynchronously in the background.
     *
     * The frontend can poll the GET /runs/{run_id} endpoint to track progress.
     * @param runId ID of the tracker run to execute
     * @returns SitemapTrackerRunRead Successful Response
     * @throws ApiError
     */
    public static executeTrackerRunApiSitemapTrackerRunsRunIdExecutePost(
        runId: string,
    ): CancelablePromise<SitemapTrackerRunRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sitemap-tracker/runs/{run_id}/execute',
            path: {
                'run_id': runId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Tracker Run
     * Get details of a specific sitemap tracker run.
     *
     * Returns comprehensive information including:
     * - Run status and progress
     * - URL counts (new, removed, changed, unchanged)
     * - Status code summary
     * - Performance metrics
     * - All detected changes
     * @param runId ID of the tracker run to retrieve
     * @returns SitemapTrackerRunRead Successful Response
     * @throws ApiError
     */
    public static getTrackerRunApiSitemapTrackerRunsRunIdGet(
        runId: string,
    ): CancelablePromise<SitemapTrackerRunRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sitemap-tracker/runs/{run_id}',
            path: {
                'run_id': runId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Run Changes
     * List all changes detected in a specific tracker run (paginated).
     *
     * Optionally filter by change type:
     * - 'new': Newly discovered URLs
     * - 'removed': URLs that are no longer in the sitemap
     * - 'status_code_change': URLs with HTTP status code changes
     *
     * Returns changes with detailed information about old and new states.
     * @param runId ID of the tracker run to get changes for
     * @param changeType Filter by change type: 'new', 'removed', 'status_code_change'
     * @param page Page number (starts at 1)
     * @param pageSize Number of items per page
     * @returns SitemapChangeList Successful Response
     * @throws ApiError
     */
    public static listRunChangesApiSitemapTrackerRunsRunIdChangesGet(
        runId: string,
        changeType?: (string | null),
        page: number = 1,
        pageSize: number = 50,
    ): CancelablePromise<SitemapChangeList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sitemap-tracker/runs/{run_id}/changes',
            path: {
                'run_id': runId,
            },
            query: {
                'change_type': changeType,
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Compare Tracker Runs
     * Compare two sitemap tracker runs side by side.
     *
     * This endpoint provides detailed comparison between two runs including:
     * - URLs added between runs
     * - URLs removed between runs
     * - URLs with status code changes
     * - Summary statistics
     *
     * Useful for analyzing sitemap evolution over time.
     * @param requestBody
     * @returns RunComparisonResponse Successful Response
     * @throws ApiError
     */
    public static compareTrackerRunsApiSitemapTrackerComparePost(
        requestBody: RunComparisonRequest,
    ): CancelablePromise<RunComparisonResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sitemap-tracker/compare',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Tracker Dashboard
     * Get dashboard overview for a client's sitemap tracker.
     *
     * Provides a high-level summary including:
     * - Latest tracker run details
     * - Total number of runs executed
     * - Total URLs being tracked
     * - Recent changes across all runs
     * - HTTP status code breakdown
     *
     * This is designed for the frontend dashboard view.
     * @param clientId ID of the client to get dashboard for
     * @returns SitemapTrackerDashboard Successful Response
     * @throws ApiError
     */
    public static getTrackerDashboardApiSitemapTrackerClientsClientIdDashboardGet(
        clientId: string,
    ): CancelablePromise<SitemapTrackerDashboard> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sitemap-tracker/clients/{client_id}/dashboard',
            path: {
                'client_id': clientId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
