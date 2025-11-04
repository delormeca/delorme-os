/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response schema for page with statistics.
 */
export type PageWithStatsResponse = {
    id: string;
    url: string;
    slug: string;
    status: string;
    is_in_sitemap: boolean;
    removed_from_sitemap_at?: (string | null);
    extraction_method?: (string | null);
    last_crawled_at?: (string | null);
    created_at: string;
    version_count: number;
    current_data: Record<string, any>;
};

