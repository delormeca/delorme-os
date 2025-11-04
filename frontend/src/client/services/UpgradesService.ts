/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProrationPreviewRequest } from '../models/ProrationPreviewRequest';
import type { UpgradeRequest } from '../models/UpgradeRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UpgradesService {
    /**
     * Get Upgrade Options
     * Get available upgrade options for the current user.
     *
     * Returns upgrade paths with pricing, proration info, and feature comparisons.
     * Includes trial information for new subscriptions and proration details for upgrades.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getUpgradeOptionsApiUpgradesOptionsGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/upgrades/options',
        });
    }
    /**
     * Create Upgrade Checkout
     * Create checkout session for plan upgrade.
     *
     * Handles:
     * - One-time plan purchases (Starter, Pro)
     * - New subscription creation (Premium, Enterprise)
     * - Subscription upgrades with proration
     * - Trial periods for new subscriptions
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createUpgradeCheckoutApiUpgradesCheckoutPost(
        requestBody: UpgradeRequest,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/upgrades/checkout',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Proration Preview
     * Get proration preview for subscription upgrade.
     *
     * Shows exactly how much the user will be charged today and explains
     * the billing cycle changes without creating a checkout session.
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getProrationPreviewApiUpgradesProrationPreviewPost(
        requestBody: ProrationPreviewRequest,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/upgrades/proration-preview',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
