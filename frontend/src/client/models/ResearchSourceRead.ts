/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for reading a research source.
 */
export type ResearchSourceRead = {
    id: string;
    url: string;
    title: (string | null);
    summary: (string | null);
    retriever: string;
    relevance_score: (number | null);
    created_at: string;
};

