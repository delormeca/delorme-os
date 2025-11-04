/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response schema for re-scanning sitemap.
 */
export type RescanSitemapResponse = {
    /**
     * Newly discovered URLs
     */
    new_urls: Array<string>;
    /**
     * URLs removed from sitemap
     */
    removed_urls: Array<string>;
    /**
     * Number of new URLs
     */
    new_count: number;
    /**
     * Number of removed URLs
     */
    removed_count: number;
    /**
     * Number of unchanged URLs
     */
    unchanged_count: number;
    /**
     * Total URLs in current sitemap
     */
    total_in_sitemap: number;
    /**
     * Summary message
     */
    message: string;
};

