/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response schema for individual sitemap change records.
 */
export type SitemapChangeRead = {
    id: string;
    client_id: string;
    sitemap_tracker_run_id: string;
    url: string;
    change_type: string;
    old_status_code?: (number | null);
    new_status_code?: (number | null);
    detected_at: string;
    last_seen_at?: (string | null);
    pushed_to_crawler: boolean;
    pushed_at?: (string | null);
    importance?: (string | null);
    notes?: (string | null);
};

