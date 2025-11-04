/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request schema for manually adding a page to crawl.
 */
export type AddManualPageRequest = {
    /**
     * The project ID
     */
    project_id: string;
    /**
     * The page URL to add
     */
    url: string;
    /**
     * Optional slug for the page
     */
    slug?: (string | null);
};

