/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SitemapChangeRead } from './SitemapChangeRead';
/**
 * Response schema for individual sitemap tracker run records.
 */
export type SitemapTrackerRunRead = {
    id: string;
    client_id: string;
    schedule_frequency: string;
    sitemap_url: string;
    status: string;
    progress_percentage: number;
    current_url_being_checked?: (string | null);
    current_status_message?: (string | null);
    total_urls_in_sitemap: number;
    total_urls_checked: number;
    new_urls_count: number;
    removed_urls_count: number;
    status_code_changes_count: number;
    unchanged_urls_count: number;
    status_code_summary?: (Record<string, number> | null);
    started_at?: (string | null);
    completed_at?: (string | null);
    created_at: string;
    error_message?: (string | null);
    error_log?: (Record<string, any> | null);
    previous_run_id?: (string | null);
    comparison_baseline_snapshot?: (Record<string, any> | null);
    execution_time_seconds?: (number | null);
    average_response_time_ms?: (number | null);
    changes?: Array<SitemapChangeRead>;
};

