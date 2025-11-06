/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for reading client page data with all Phase 3 fields.
 */
export type ClientPageRead = {
    /**
     * Full URL of the page
     */
    url: string;
    /**
     * URL slug for the page
     */
    slug?: (string | null);
    id: string;
    client_id: string;
    status_code?: (number | null);
    is_failed: boolean;
    failure_reason?: (string | null);
    retry_count: number;
    last_checked_at?: (string | null);
    created_at: string;
    updated_at: string;
    /**
     * HTML title tag
     */
    page_title?: (string | null);
    /**
     * SEO meta title
     */
    meta_title?: (string | null);
    /**
     * SEO meta description
     */
    meta_description?: (string | null);
    /**
     * Main H1 heading
     */
    h1?: (string | null);
    /**
     * Canonical URL
     */
    canonical_url?: (string | null);
    /**
     * Hreflang tags
     */
    hreflang?: (string | null);
    /**
     * Meta robots directives
     */
    meta_robots?: (string | null);
    /**
     * Word count of body content
     */
    word_count?: (number | null);
    /**
     * Full page body text
     */
    body_content?: (string | null);
    /**
     * Heading hierarchy structure
     */
    webpage_structure?: (Record<string, any> | null);
    /**
     * Structured data/schema markup
     */
    schema_markup?: (Record<string, any> | null);
    /**
     * Named entities with salience scores
     */
    salient_entities?: (Record<string, any> | null);
    /**
     * Internal links found on page
     */
    internal_links?: (Record<string, any> | null);
    /**
     * External links found on page
     */
    external_links?: (Record<string, any> | null);
    /**
     * Number of images on page
     */
    image_count?: (number | null);
    /**
     * Vector embedding of body content
     */
    body_content_embedding?: (string | null);
    /**
     * Screenshot thumbnail URL
     */
    screenshot_url?: (string | null);
    /**
     * Full page screenshot URL
     */
    screenshot_full_url?: (string | null);
    /**
     * Last crawl timestamp
     */
    last_crawled_at?: (string | null);
    /**
     * Associated crawl run ID
     */
    crawl_run_id?: (string | null);
};

