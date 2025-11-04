import { ArticlesService } from "@/client";
import { useQuery } from "@tanstack/react-query";

export const useArticleDetail = (id?: string) => {
  return useQuery({
    queryKey: ["article", id],
    queryFn: () =>
      ArticlesService.readArticleApiArticlesArticleIdGet(id ? parseInt(id) : 0),
    enabled: !!id,
  });
};
