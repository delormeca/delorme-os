/**
 * Custom hook to delete an article using a mutation.
 *
 * This hook utilizes the `useMutation` hook from `@tanstack/react-query` to perform the delete operation.
 * It also uses the `useSnackBarContext` to display success or error messages based on the result of the mutation.
 *
 * @returns {Mutation} - The mutation object returned by `useMutation`.
 *
 * @example
 * const { mutateAsync: deleteArticle } = useDeleteArticle();
 * await deleteArticle(articleId);
 */
import { ArticlesService } from "@/client";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: ArticlesService.deleteArticleApiArticlesArticleIdDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["articles"],
      });
      createSnackBar({
        content: "Article deleted successfully",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error) => {
      createSnackBar({
        content: error.message,
        severity: "error",
        autoHide: true,
      });
    },
  });
};
