/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AnalyticsService {
    /**
     * Get Basic Analytics
     * Get basic analytics for Starter+ users.
     *
     * Includes:
     * - Total articles created
     * - Published vs draft count
     * - Recent activity summary
     *
     * Requires: BASIC_ANALYTICS permission (Starter plan or higher)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getBasicAnalyticsApiAnalyticsBasicGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/analytics/basic',
        });
    }
    /**
     * Get Advanced Analytics
     * Get advanced analytics for Pro+ users.
     *
     * Includes:
     * - Detailed performance metrics
     * - Monthly breakdown
     * - Content analysis
     * - Growth trends
     *
     * Requires: ADVANCED_ANALYTICS permission (Pro plan or higher)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getAdvancedAnalyticsApiAnalyticsAdvancedGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/analytics/advanced',
        });
    }
    /**
     * Get Premium Reporting
     * Get premium reporting features for Premium+ subscribers.
     *
     * Includes:
     * - Custom report generation
     * - Data export options
     * - Benchmarking data
     * - Advanced filtering
     *
     * Requires: ADVANCED_REPORTING permission (Premium subscription or higher)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getPremiumReportingApiAnalyticsReportingGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/analytics/reporting',
        });
    }
    /**
     * Get Team Analytics
     * Get team analytics for Enterprise subscribers.
     *
     * Includes:
     * - Team performance metrics
     * - Collaboration insights
     * - Resource utilization
     * - Team productivity reports
     *
     * Requires: TEAM_MANAGEMENT permission (Enterprise subscription)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getTeamAnalyticsApiAnalyticsTeamGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/analytics/team',
        });
    }
}
