/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for creating a new research request.
 */
export type ResearchRequestCreate = {
    /**
     * Research question
     */
    query: string;
    /**
     * Type of report
     */
    report_type?: string;
    /**
     * Tone of the report
     */
    tone?: string;
    /**
     * Max iterations
     */
    max_iterations?: number;
    /**
     * Search depth
     */
    search_depth?: number;
    /**
     * List of retrievers to use
     */
    retrievers?: Array<string>;
    /**
     * Start research immediately
     */
    auto_start?: boolean;
};

