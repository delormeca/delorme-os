/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for updating an existing client page.
 */
export type ClientPageUpdate = {
    /**
     * HTTP status code
     */
    status_code?: (number | null);
    /**
     * Whether the page check failed
     */
    is_failed?: (boolean | null);
    /**
     * Reason for failure
     */
    failure_reason?: (string | null);
    /**
     * Number of retry attempts
     */
    retry_count?: (number | null);
    /**
     * Last time page was checked
     */
    last_checked_at?: (string | null);
    /**
     * Array of tags for filtering and categorization
     */
    tags?: (Array<string> | null);
};

