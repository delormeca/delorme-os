/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProjectLeadBasic } from './ProjectLeadBasic';
export type ClientRead = {
    id: string;
    name: string;
    slug: string;
    description?: (string | null);
    website_url?: (string | null);
    sitemap_url?: (string | null);
    industry?: (string | null);
    team_lead?: (string | null);
    logo_url?: (string | null);
    crawl_frequency: string;
    status: string;
    page_count: number;
    engine_setup_completed?: boolean;
    last_setup_run_id?: (string | null);
    project_lead_id?: (string | null);
    project_lead?: (ProjectLeadBasic | null);
    created_by: string;
    created_at: string;
    updated_at: string;
};

