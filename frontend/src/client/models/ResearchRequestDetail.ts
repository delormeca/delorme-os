/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResearchSourceRead } from './ResearchSourceRead';
/**
 * Schema for detailed research request view (includes sources and report).
 */
export type ResearchRequestDetail = {
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
    report_content: (string | null);
    report_markdown: (string | null);
    sources?: Array<ResearchSourceRead>;
    error_message: (string | null);
};

