/**
 * Custom hook to create an article using the ArticlesService.
 *
 * This hook utilizes the `useMutation` hook from `@tanstack/react-query` to handle
 * the mutation for creating a new article.
 *
 * @returns {UseMutationResult} The result of the mutation, including status and mutation functions.
 *
 * @example
 * const { mutateAsync: createArticle } = useCreateArticle();
 * await createArticle(articleData);
 */
import { ArticlesService } from "@/client";
import { useMutation } from "@tanstack/react-query";

export const useCreateArticle = () => {
  return useMutation({
    mutationFn: ArticlesService.createArticleApiArticlesPost,
  });
};
