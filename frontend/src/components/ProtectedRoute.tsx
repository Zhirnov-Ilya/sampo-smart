import { Navigate } from "react-router-dom";

import { PageLoader } from "./PageLoader";
import { useMe } from "../features/auth/useMe";


type ProtectedRouteProps = {
  children: React.ReactNode;
};


export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem("access_token");
  const { data: user, isLoading, isError } = useMe();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !user) {
    localStorage.removeItem("access_token");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}