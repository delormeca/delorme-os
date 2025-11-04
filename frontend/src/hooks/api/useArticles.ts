
/**
 * Custom hook to fetch articles using react-query.
 *
 * @param {Object} params - Parameters for fetching articles.
 * @param {boolean} [params.publishedOnly] - If true, fetch only published articles.
 * @returns {QueryObserverResult} The result of the query, including status and data.
 */
import { ArticlesService } from "@/client";
import { useQuery } from "@tanstack/react-query";

export const useArticles = ({ publishedOnly }: { publishedOnly?: boolean } = {}) => {
  return useQuery({
    queryKey: ["articles"],
    queryFn: () => ArticlesService.listArticlesApiArticlesGet(publishedOnly),
  });
};
