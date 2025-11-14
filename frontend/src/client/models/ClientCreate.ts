/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ClientCreate = {
    name: string;
    /**
     * URL-friendly slug (auto-generated from name if not provided)
     */
    slug?: (string | null);
    description?: (string | null);
    website_url?: (string | null);
    sitemap_url?: (string | null);
    industry?: (string | null);
    /**
     * Team lead name. Must be: Tommy Delorme, Ismael Girard, or OP
     */
    team_lead?: (string | null);
    logo_url?: (string | null);
    crawl_frequency?: string;
    status?: string;
    project_lead_id?: (string | null);
};

