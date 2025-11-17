/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SitemapChangeRead } from './SitemapChangeRead';
import type { SitemapTrackerRunRead } from './SitemapTrackerRunRead';
/**
 * Response schema for sitemap tracker dashboard overview.
 */
export type SitemapTrackerDashboard = {
    /**
     * Most recent tracker run
     */
    latest_run?: (SitemapTrackerRunRead | null);
    /**
     * Total number of runs executed
     */
    total_runs: number;
    /**
     * Total number of unique URLs being tracked
     */
    total_urls_tracked: number;
    /**
     * Recent sitemap changes
     */
    recent_changes?: Array<SitemapChangeRead>;
    /**
     * Breakdown of HTTP status codes
     */
    status_code_breakdown?: Record<string, number>;
};

