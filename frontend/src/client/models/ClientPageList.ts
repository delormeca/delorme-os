/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClientPageRead } from './ClientPageRead';
/**
 * Schema for paginated client page list response.
 */
export type ClientPageList = {
    pages: Array<ClientPageRead>;
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
};

