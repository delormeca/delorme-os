/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for reading research request (list view).
 */
export type ResearchRequestRead = {
    id: string;
    user_id: string;
    query: string;
    report_type: string;
    tone: string;
    status: string;
    progress: number;
    total_sources: number;
    cost_usd: number;
    duration_seconds: (number | null);
    created_at: string;
    started_at: (string | null);
    completed_at: (string | null);
};

