/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EngineSetupListResponse } from '../models/EngineSetupListResponse';
import type { EngineSetupProgressResponse } from '../models/EngineSetupProgressResponse';
import type { EngineSetupRequest } from '../models/EngineSetupRequest';
import type { EngineSetupRunRead } from '../models/EngineSetupRunRead';
import type { EngineSetupStartResponse } from '../models/EngineSetupStartResponse';
import type { EngineSetupStatsResponse } from '../models/EngineSetupStatsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EngineSetupService {
    /**
     * Start Engine Setup
     * Start an engine setup run (sitemap or manual import).
     *
     * This creates a setup run and schedules a background task to process it.
     * @param requestBody
     * @returns EngineSetupStartResponse Successful Response
     * @throws ApiError
     */
    public static startEngineSetupApiEngineSetupStartPost(
        requestBody: EngineSetupRequest,
    ): CancelablePromise<EngineSetupStartResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/engine-setup/start',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Setup Run
     * Get details of a specific setup run.
     * @param runId
     * @returns EngineSetupRunRead Successful Response
     * @throws ApiError
     */
    public static getSetupRunApiEngineSetupRunIdGet(
        runId: string,
    ): CancelablePromise<EngineSetupRunRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/engine-setup/{run_id}',
            path: {
                'run_id': runId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Setup Progress
     * Get real-time progress of a setup run.
     *
     * Frontend polls this endpoint every 2 seconds during setup.
     * @param runId
     * @returns EngineSetupProgressResponse Successful Response
     * @throws ApiError
     */
    public static getSetupProgressApiEngineSetupRunIdProgressGet(
        runId: string,
    ): CancelablePromise<EngineSetupProgressResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/engine-setup/{run_id}/progress',
            path: {
                'run_id': runId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Client Setup Runs
     * List all setup runs for a specific client.
     * @param clientId
     * @param limit
     * @returns EngineSetupListResponse Successful Response
     * @throws ApiError
     */
    public static listClientSetupRunsApiEngineSetupClientClientIdRunsGet(
        clientId: string,
        limit: number = 10,
    ): CancelablePromise<EngineSetupListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/engine-setup/client/{client_id}/runs',
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
    /**
     * Get Client Setup Stats
     * Get engine setup statistics for a client.
     * @param clientId
     * @returns EngineSetupStatsResponse Successful Response
     * @throws ApiError
     */
    public static getClientSetupStatsApiEngineSetupClientClientIdStatsGet(
        clientId: string,
    ): CancelablePromise<EngineSetupStatsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/engine-setup/client/{client_id}/stats',
            path: {
                'client_id': clientId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cancel Setup Run
     * Cancel a running setup.
     *
     * This marks the run as failed and attempts to cancel the background job.
     * @param runId
     * @returns EngineSetupRunRead Successful Response
     * @throws ApiError
     */
    public static cancelSetupRunApiEngineSetupRunIdCancelPost(
        runId: string,
    ): CancelablePromise<EngineSetupRunRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/engine-setup/{run_id}/cancel',
            path: {
                'run_id': runId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
