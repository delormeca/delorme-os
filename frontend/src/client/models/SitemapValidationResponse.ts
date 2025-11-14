/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for sitemap validation response.
 */
export type SitemapValidationResponse = {
    /**
     * Whether sitemap is valid and accessible
     */
    valid: boolean;
    /**
     * HTTP status code if fetched
     */
    status_code?: (number | null);
    /**
     * Number of URLs found in sitemap
     */
    url_count?: number;
    /**
     * Type of sitemap (urlset, sitemap_index, rss)
     */
    sitemap_type?: (string | null);
    /**
     * Error category if validation failed
     */
    error_type?: (string | null);
    /**
     * Detailed error message if validation failed
     */
    error_message?: (string | null);
    /**
     * User-friendly suggestion for resolution
     */
    suggestion?: (string | null);
    /**
     * Time taken to parse in seconds
     */
    parse_time?: number;
};

