/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to update tags for multiple pages.
 */
export type BulkUpdateTagsRequest = {
    /**
     * List of page IDs to update
     */
    page_ids: Array<string>;
    /**
     * Array of tag strings to apply to all pages
     */
    tags: Array<string>;
    /**
     * Update mode: 'replace' (replace all tags) or 'append' (add to existing tags)
     */
    mode?: string;
};

