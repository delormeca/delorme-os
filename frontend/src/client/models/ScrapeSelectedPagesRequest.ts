/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request schema for scraping selected pages.
 */
export type ScrapeSelectedPagesRequest = {
    /**
     * List of page IDs to scrape
     */
    page_ids: Array<string>;
    /**
     * Extraction method: crawl4ai or jina
     */
    extraction_method?: string;
};

