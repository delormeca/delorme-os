/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for starting an engine setup run.
 */
export type EngineSetupRequest = {
    /**
     * Client ID to run setup for
     */
    client_id: string;
    /**
     * Type of setup: sitemap or manual
     */
    setup_type: EngineSetupRequest.setup_type;
    /**
     * Sitemap URL (required for sitemap type)
     */
    sitemap_url?: (string | null);
    /**
     * List of URLs (required for manual type)
     */
    manual_urls?: (Array<string> | null);
};
export namespace EngineSetupRequest {
    /**
     * Type of setup: sitemap or manual
     */
    export enum setup_type {
        SITEMAP = 'sitemap',
        MANUAL = 'manual',
    }
}

