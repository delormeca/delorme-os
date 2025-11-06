/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for progress tracking response.
 */
export type EngineSetupProgressResponse = {
    run_id: string;
    status: string;
    progress_percentage: number;
    current_url?: (string | null);
    total_pages: number;
    successful_pages: number;
    failed_pages: number;
    skipped_pages: number;
    error_message?: (string | null);
    started_at?: (string | null);
    completed_at?: (string | null);
};

