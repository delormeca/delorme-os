/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request schema for updating sitemap tracker configuration.
 */
export type SitemapTrackerConfigUpdate = {
    /**
     * URL of the sitemap to track
     */
    sitemap_url?: (string | null);
    /**
     * Frequency of automatic tracking (e.g., 'daily', 'weekly', 'bi_monthly', 'monthly', 'manual_only')
     */
    tracking_frequency?: (string | null);
    /**
     * Whether tracking is enabled for this client
     */
    enabled?: (boolean | null);
};

