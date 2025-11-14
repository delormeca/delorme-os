/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response with all unique tags for a client.
 */
export type AllTagsResponse = {
    client_id: string;
    /**
     * All unique tags across client pages, sorted alphabetically
     */
    tags: Array<string>;
    /**
     * Total number of unique tags
     */
    tag_count: number;
};

