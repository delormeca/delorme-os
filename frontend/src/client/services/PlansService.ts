/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FeatureAccessRequest } from '../models/FeatureAccessRequest';
import type { FeatureAccessResponse } from '../models/FeatureAccessResponse';
import type { PlanInfoResponse } from '../models/PlanInfoResponse';
import type { UpgradeOptionResponse } from '../models/UpgradeOptionResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PlansService {
    /**
     * Get My Plan Info
     * Get comprehensive plan information for the current user.
     *
     * Returns:
     * - Current plan level
     * - Available permissions
     * - Active subscription details
     * - Purchase history
     * - Feature breakdown by category
     * @returns PlanInfoResponse Successful Response
     * @throws ApiError
     */
    public static getMyPlanInfoApiPlansMeGet(): CancelablePromise<PlanInfoResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/plans/me',
        });
    }
    /**
     * Check Feature Access
     * Check if the current user has access to a specific feature.
     *
     * This endpoint is useful for frontend components to determine
     * whether to show certain features or upgrade prompts.
     * @param requestBody
     * @returns FeatureAccessResponse Successful Response
     * @throws ApiError
     */
    public static checkFeatureAccessApiPlansCheckFeaturePost(
        requestBody: FeatureAccessRequest,
    ): CancelablePromise<FeatureAccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/plans/check-feature',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Available Upgrades
     * Get available plan upgrades for the current user.
     *
     * Returns upgrade options with pricing and feature information.
     * Useful for displaying upgrade prompts and pricing pages.
     * @returns UpgradeOptionResponse Successful Response
     * @throws ApiError
     */
    public static getAvailableUpgradesApiPlansUpgradesGet(): CancelablePromise<Array<UpgradeOptionResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/plans/upgrades',
        });
    }
    /**
     * Get All Features
     * Get all available features and their descriptions.
     *
     * Useful for displaying feature comparison tables.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getAllFeaturesApiPlansFeaturesGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/plans/features',
        });
    }
    /**
     * Get Plan Comparison
     * Get a comparison of all plans and their features.
     *
     * Useful for pricing pages and plan comparison tables.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getPlanComparisonApiPlansComparisonGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/plans/comparison',
        });
    }
}
