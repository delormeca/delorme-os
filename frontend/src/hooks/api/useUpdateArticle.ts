import { ArticlesService, ArticleUpdate } from "@/client";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateArticle = (id?: string) => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();
  return useMutation({
    mutationFn: (requestBody: ArticleUpdate) =>
      ArticlesService.updateArticleApiArticlesArticleIdPut(
        id ? parseInt(id) : 0,
        requestBody
      ),
    onSuccess: () => {
      // Invalidate the cache to refetch the data
      queryClient.invalidateQueries({
        queryKey: ["article", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["articles"],
      });
      createSnackBar({
        content: "Article updated successfully",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error) => {
      createSnackBar({
        content: "Failed to update article. Please try again.",
        severity: "error",
        autoHide: true,
      });
    },
  });
};
