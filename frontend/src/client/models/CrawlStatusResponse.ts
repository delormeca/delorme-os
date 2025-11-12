/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response with crawl status.
 */
export type CrawlStatusResponse = {
    id: string;
    status: string;
    progress_percentage: number;
    current_page_url: (string | null);
    current_status_message: (string | null);
    total_pages: number;
    successful_pages: number;
    failed_pages: number;
    started_at: (string | null);
    completed_at: (string | null);
    performance_metrics: (Record<string, any> | null);
    api_costs: (Record<string, any> | null);
    errors: Array<Record<string, any>>;
};

