import { AuthService, UserUpdate } from "@/client";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();
  return useMutation({
    mutationFn: (requestBody: UserUpdate) =>
      AuthService.updateUserProfileApiAuthProfilePut(requestBody),
    onSuccess: () => {
      // Invalidate the cache to refetch the data
      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
      });
      createSnackBar({
        content: "Profile updated successfully",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error) => {
      createSnackBar({
        content: "Failed to update profile. Please try again.",
        severity: "error",
        autoHide: true,
      });
    },
  });
};
