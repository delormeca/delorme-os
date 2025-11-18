/**
 * Hook to fetch enhanced crawl results with historical tracking.
 * Each datapoint includes current value + history from previous crawls.
 */
import { useQuery } from '@tanstack/react-query';
import { OpenAPI } from '@/client';

// Types matching backend Pydantic schemas
export interface DatapointHistory {
  value: string | number | boolean | null | any;
  crawled_at: string; // ISO datetime
  crawl_run_id: string; // UUID
  version: number;
}

export interface EnhancedDatapoint {
  current: string | number | boolean | null | any;
  history: DatapointHistory[];
  has_changed: boolean;
}

export interface EnhancedCrawlPageData {
  id: string; // UUID
  url: string;
  slug: string | null;

  // All datapoints with history
  status_code: EnhancedDatapoint;
  page_title: EnhancedDatapoint;
  meta_title: EnhancedDatapoint;
  meta_description: EnhancedDatapoint;
  h1: EnhancedDatapoint;
  canonical_url: EnhancedDatapoint;
  meta_robots: EnhancedDatapoint;
  word_count: EnhancedDatapoint;
  image_count: EnhancedDatapoint;
  internal_link_count: EnhancedDatapoint;
  external_link_count: EnhancedDatapoint;

  // Metadata
  tags: string[] | null;
  last_crawled_at: string | null;
  crawl_count: number;
  created_at: string;
}

export interface EnhancedCrawlResultsList {
  pages: EnhancedCrawlPageData[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UseEnhancedCrawlResultsParams {
  clientId: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export const useEnhancedCrawlResults = ({
  clientId,
  search,
  page = 1,
  page_size = 50,
}: UseEnhancedCrawlResultsParams) => {
  return useQuery<EnhancedCrawlResultsList>({
    queryKey: ['enhanced-crawl-results', clientId, search, page, page_size],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('page_size', page_size.toString());

      const url = `${OpenAPI.BASE}/api/clients/${clientId}/crawl-results?${params}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch enhanced crawl results');
      }

      return response.json();
    },
    enabled: !!clientId,
  });
};
