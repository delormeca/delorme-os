/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response after processing crawl results.
 */
export type CrawlProcessResponse = {
    /**
     * Crawl run ID
     */
    crawl_run_id: string;
    /**
     * Pages processed
     */
    pages_processed: number;
    /**
     * Embeddings generated
     */
    embeddings_generated: number;
    /**
     * Embedding errors
     */
    embedding_errors?: number;
    /**
     * Similarity calculations
     */
    similarity_calculated: number;
    /**
     * Status message
     */
    message: string;
};

