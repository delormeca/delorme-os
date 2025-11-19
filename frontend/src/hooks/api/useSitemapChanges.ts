import { useQuery } from '@tanstack/react-query';
import { OpenAPI } from '@/client';

export interface SitemapChange {
  id: string;
  client_id: string;
  sitemap_tracker_run_id: string;
  url: string;
  change_type: string; // 'added', 'removed', 'status_changed'
  old_status_code: number | null;
  new_status_code: number | null;
  detected_at: string;
  last_seen_at: string | null;
  pushed_to_crawler: boolean;
  pushed_at: string | null;
  importance: string | null;
  notes: string | null;
}

export interface SitemapChangeList {
  items: SitemapChange[];
  total: number;
  page: number;
  page_size: number;
}

export interface SitemapChangesParams {
  run_id: string;
  change_type?: string; // Optional filter: 'added', 'removed', 'status_changed'
  page?: number;
  page_size?: number;
}

/**
 * Hook to fetch sitemap changes for a specific tracker run
 */
export const useSitemapChanges = (params: SitemapChangesParams) => {
  const { run_id, change_type, page = 1, page_size = 50 } = params;

  return useQuery<SitemapChangeList>({
    queryKey: ['sitemap-changes', run_id, change_type, page, page_size],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (change_type) params.append('change_type', change_type);
      params.append('page', page.toString());
      params.append('page_size', page_size.toString());

      const url = `${OpenAPI.BASE}/api/sitemap-tracker/runs/${run_id}/changes?${params}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sitemap changes');
      }

      return response.json();
    },
    enabled: !!run_id, // Only run if run_id is provided
  });
};
