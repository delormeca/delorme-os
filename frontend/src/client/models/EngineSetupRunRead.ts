/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for reading engine setup run data.
 */
export type EngineSetupRunRead = {
    id: string;
    client_id: string;
    setup_type: string;
    total_pages: number;
    successful_pages: number;
    failed_pages: number;
    skipped_pages: number;
    status: string;
    current_url?: (string | null);
    progress_percentage: number;
    error_message?: (string | null);
    started_at?: (string | null);
    completed_at?: (string | null);
    created_at: string;
};

