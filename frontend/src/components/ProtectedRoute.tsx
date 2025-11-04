import { Navigate, Outlet } from "react-router-dom";
import { AuthService } from "@/client";
import { useQuery } from "@tanstack/react-query";

export default function ProtectedRoute({ redirectPath = "/login" }) {
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: AuthService.currentUserApiAuthCurrentGet,
  });

  const isAuthenticated = !!currentUser?.email;

  if (isLoading) {
    return null;
  }
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}
