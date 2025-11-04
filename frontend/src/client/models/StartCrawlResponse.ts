/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response schema for starting a crawl job.
 */
export type StartCrawlResponse = {
    /**
     * The created crawl job ID
     */
    crawl_job_id: string;
    /**
     * Current status of the job
     */
    status: string;
    /**
     * Current phase of the job
     */
    phase: string;
    /**
     * Success message
     */
    message: string;
};

