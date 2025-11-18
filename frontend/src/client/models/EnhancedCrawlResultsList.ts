/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EnhancedCrawlPageData_Output } from './EnhancedCrawlPageData_Output';
/**
 * Paginated list of enhanced crawl results with historical tracking.
 */
export type EnhancedCrawlResultsList = {
    pages: Array<EnhancedCrawlPageData_Output>;
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
};

