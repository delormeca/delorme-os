/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type HealthCheckDetail = {
    status: HealthCheckDetail.status;
    message: string;
    details?: (Record<string, any> | null);
    timestamp: string;
};
export namespace HealthCheckDetail {
    export enum status {
        PASS = 'pass',
        WARN = 'warn',
        FAIL = 'fail',
    }
}

