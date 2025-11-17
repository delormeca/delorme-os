/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HealthCheckDetail } from './HealthCheckDetail';
export type HealthCheckResponse = {
    overall_status: HealthCheckResponse.overall_status;
    timestamp: string;
    checks: Record<string, HealthCheckDetail>;
    execution_time_ms: number;
    recommendations: Array<string>;
};
export namespace HealthCheckResponse {
    export enum overall_status {
        HEALTHY = 'healthy',
        DEGRADED = 'degraded',
        UNHEALTHY = 'unhealthy',
    }
}

