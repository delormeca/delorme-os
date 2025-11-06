/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for reading client page data.
 */
export type ClientPageRead = {
    /**
     * Full URL of the page
     */
    url: string;
    /**
     * URL slug for the page
     */
    slug?: (string | null);
    id: string;
    client_id: string;
    status_code?: (number | null);
    is_failed: boolean;
    failure_reason?: (string | null);
    retry_count: number;
    last_checked_at?: (string | null);
    created_at: string;
    updated_at: string;
};

