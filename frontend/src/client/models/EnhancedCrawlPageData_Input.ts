/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EnhancedDatapoint } from './EnhancedDatapoint';
/**
 * Enhanced page data with historical tracking for all 83 datapoints from Apify.
 */
export type EnhancedCrawlPageData_Input = {
    id: string;
    url: string;
    slug?: (string | null);
    status_code: EnhancedDatapoint;
    page_title: EnhancedDatapoint;
    meta_title: EnhancedDatapoint;
    meta_description: EnhancedDatapoint;
    h1: EnhancedDatapoint;
    canonical_url: EnhancedDatapoint;
    meta_robots: EnhancedDatapoint;
    word_count: EnhancedDatapoint;
    publishing_date: EnhancedDatapoint;
    last_modified: EnhancedDatapoint;
    h1_count: EnhancedDatapoint;
    h2_count: EnhancedDatapoint;
    h3_count: EnhancedDatapoint;
    h4_count: EnhancedDatapoint;
    h5_count: EnhancedDatapoint;
    h6_count: EnhancedDatapoint;
    h1_list: EnhancedDatapoint;
    webpage_structure: EnhancedDatapoint;
    raw_text: EnhancedDatapoint;
    markdown_text: EnhancedDatapoint;
    character_count: EnhancedDatapoint;
    readability_score: EnhancedDatapoint;
    page_weight_kb: EnhancedDatapoint;
    page_weight_mb: EnhancedDatapoint;
    load_time_ms: EnhancedDatapoint;
    meta_keywords: EnhancedDatapoint;
    meta_viewport: EnhancedDatapoint;
    meta_generator: EnhancedDatapoint;
    schema_markup: EnhancedDatapoint;
    schema_types: EnhancedDatapoint;
    hreflang: EnhancedDatapoint;
    internal_links: EnhancedDatapoint;
    internal_link_count: EnhancedDatapoint;
    external_links: EnhancedDatapoint;
    external_link_count: EnhancedDatapoint;
    total_link_count: EnhancedDatapoint;
    image_count: EnhancedDatapoint;
    image_alt_texts: EnhancedDatapoint;
    video_count: EnhancedDatapoint;
    iframe_count: EnhancedDatapoint;
    og_title: EnhancedDatapoint;
    og_description: EnhancedDatapoint;
    og_image: EnhancedDatapoint;
    og_type: EnhancedDatapoint;
    og_url: EnhancedDatapoint;
    og_site_name: EnhancedDatapoint;
    og_locale: EnhancedDatapoint;
    twitter_card: EnhancedDatapoint;
    twitter_title: EnhancedDatapoint;
    twitter_description: EnhancedDatapoint;
    twitter_image: EnhancedDatapoint;
    twitter_site: EnhancedDatapoint;
    twitter_creator: EnhancedDatapoint;
    fb_app_id: EnhancedDatapoint;
    fb_admins: EnhancedDatapoint;
    http_status_code: EnhancedDatapoint;
    apify_loaded_url: EnhancedDatapoint;
    apify_loaded_time: EnhancedDatapoint;
    apify_referrer_url: EnhancedDatapoint;
    apify_crawl_depth: EnhancedDatapoint;
    apify_request_handler_mode: EnhancedDatapoint;
    apify_has_html: EnhancedDatapoint;
    apify_has_markdown: EnhancedDatapoint;
    apify_has_screenshot: EnhancedDatapoint;
    screenshot_url: EnhancedDatapoint;
    screenshot_file: EnhancedDatapoint;
    html_lang: EnhancedDatapoint;
    html_dir: EnhancedDatapoint;
    charset: EnhancedDatapoint;
    favicon: EnhancedDatapoint;
    form_count: EnhancedDatapoint;
    input_count: EnhancedDatapoint;
    button_count: EnhancedDatapoint;
    script_count: EnhancedDatapoint;
    style_count: EnhancedDatapoint;
    external_scripts: EnhancedDatapoint;
    external_stylesheets: EnhancedDatapoint;
    language: EnhancedDatapoint;
    author: EnhancedDatapoint;
    tags?: (Array<string> | null);
    last_crawled_at?: (string | null);
    /**
     * Total number of times crawled
     */
    crawl_count?: number;
    created_at: string;
};

