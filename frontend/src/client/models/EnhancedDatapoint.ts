/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DatapointHistory } from './DatapointHistory';
/**
 * Datapoint with current value and historical versions.
 */
export type EnhancedDatapoint = {
    /**
     * Current/latest value
     */
    current?: (string | number | boolean | Record<string, any> | null);
    /**
     * Historical values ordered by crawled_at desc
     */
    history?: Array<DatapointHistory>;
    /**
     * Whether value changed from previous crawl
     */
    has_changed?: boolean;
};

