/**
 * Custom hook to fetch the current user data using react-query.
 *
 * This hook utilizes the `useQuery` hook from `@tanstack/react-query` to fetch
 * the current user data by calling the `currentUserApiAuthCurrentGet` method
 * from `AuthService`. The query is configured to not refetch on window focus,
 * and it does not retry on failure.
 *
 * @returns {object} The result of the `useQuery` hook, which includes the current user data,
 *                   loading state, error state, and other query-related information.
 */
import { useQuery } from "@tanstack/react-query";
import { AuthService } from "@/client";

export const useCurrentUser = () => {
  const result = useQuery({
    queryKey: ["currentUser"],
    queryFn: AuthService.currentUserApiAuthCurrentGet,
    refetchOnWindowFocus: false,
    retry: false,
  });
  return result;
};
