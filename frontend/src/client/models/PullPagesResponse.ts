/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response after pulling pages from sitemap tracker.
 */
export type PullPagesResponse = {
    /**
     * Total URLs in latest sitemap
     */
    total_urls_in_sitemap: number;
    /**
     * Number of new pages added
     */
    new_pages_added: number;
    /**
     * Number of pages that already existed
     */
    existing_pages_skipped: number;
    /**
     * URLs of newly added pages
     */
    pages: Array<string>;
    /**
     * Status message
     */
    message: string;
};

