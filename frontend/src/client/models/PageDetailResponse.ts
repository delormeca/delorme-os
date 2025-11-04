/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PageDataResponse } from './PageDataResponse';
/**
 * Response schema for detailed page information.
 */
export type PageDetailResponse = {
    id: string;
    project_id: string;
    url: string;
    slug: string;
    status: string;
    extraction_method?: (string | null);
    last_crawled_at?: (string | null);
    created_at: string;
    page_data?: Array<PageDataResponse>;
};

