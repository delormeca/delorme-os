/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for creating a new client page.
 */
export type ClientPageCreate = {
    /**
     * Full URL of the page
     */
    url: string;
    /**
     * URL slug for the page
     */
    slug?: (string | null);
    /**
     * Client ID this page belongs to
     */
    client_id: string;
};

