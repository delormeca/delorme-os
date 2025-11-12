/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for engine setup statistics for a client.
 */
export type EngineSetupStatsResponse = {
    client_id: string;
    total_runs: number;
    total_pages_discovered: number;
    last_run_at?: (string | null);
    engine_setup_completed: boolean;
};

