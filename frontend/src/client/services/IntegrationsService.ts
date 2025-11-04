/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IntegrationSetupRequest } from '../models/IntegrationSetupRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class IntegrationsService {
    /**
     * Get Available Integrations
     * Get all available integrations based on user's plan.
     *
     * Returns different integration tiers:
     * - Basic: Available to all plans
     * - Premium: Available to Premium+ subscribers
     * - Enterprise: Available to Enterprise subscribers only
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getAvailableIntegrationsApiIntegrationsGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/integrations',
        });
    }
    /**
     * Get Integration Status
     * Get status of all configured integrations for the current user.
     *
     * Shows which integrations are active, configured, or need attention.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getIntegrationStatusApiIntegrationsStatusGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/integrations/status',
        });
    }
    /**
     * Get Integration Details
     * Get detailed information about a specific integration.
     *
     * Includes setup instructions, features, and access requirements.
     * @param integrationId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getIntegrationDetailsApiIntegrationsIntegrationIdGet(
        integrationId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/integrations/{integration_id}',
            path: {
                'integration_id': integrationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Setup Integration
     * Set up and configure a new integration.
     *
     * Requires appropriate plan permissions for the integration type.
     * @param integrationId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static setupIntegrationApiIntegrationsIntegrationIdSetupPost(
        integrationId: string,
        requestBody: IntegrationSetupRequest,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/integrations/{integration_id}/setup',
            path: {
                'integration_id': integrationId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
