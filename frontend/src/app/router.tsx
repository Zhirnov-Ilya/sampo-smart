import type { ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { EquipmentPage } from "../pages/EquipmentPage";
import { DowntimesPage } from "../pages/DowntimesPage";
import { HypothesesPage } from "../pages/HypothesesPage";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AppLayout } from "../components/AppLayout";
import { HypothesisDetailsPage } from "../pages/HypothesisDetailsPage";
import { AdminEnterprisesPage } from "../pages/AdminEnterprisesPage";
import { AdminUsersPage } from "../pages/AdminUsersPage";
import { AdminEquipmentTypesPage } from "../pages/AdminEquipmentTypesPage";
import { AdminEquipmentPage } from "../pages/AdminEquipmentPage";
import { PageLoader } from "../components/PageLoader";
import { useMe } from "../features/auth/useMe";
import { normalizeUserRole } from "../utils/roles";

type RoleRouteProps = {
  children: ReactNode;
  allowedRoles: string[];
};

function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return <PageLoader />;
  }

  const currentRole = normalizeUserRole(user?.role);

  const normalizedAllowedRoles = allowedRoles.map((role) =>
    normalizeUserRole(role)
  );

  if (!normalizedAllowedRoles.includes(currentRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function protectedRolePage(page: ReactNode, allowedRoles: string[]) {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={allowedRoles}>
        <AppLayout>{page}</AppLayout>
      </RoleRoute>
    </ProtectedRoute>
  );
}

const allRoles = ["SUPER_ADMIN", "ENTERPRISE_ADMIN", "MANAGER", "ANALYST"];

const adminRoles = ["SUPER_ADMIN", "ENTERPRISE_ADMIN"];

const superAdminOnly = ["SUPER_ADMIN"];

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: protectedRolePage(<DashboardPage />, allRoles),
  },
  {
    path: "/equipment",
    element: protectedRolePage(<EquipmentPage />, adminRoles),
  },
  {
    path: "/downtimes",
    element: protectedRolePage(<DowntimesPage />, allRoles),
  },
  {
    path: "/hypotheses",
    element: protectedRolePage(<HypothesesPage />, allRoles),
  },
  {
    path: "/hypotheses/:id",
    element: protectedRolePage(<HypothesisDetailsPage />, allRoles),
  },
  {
    path: "/admin/enterprises",
    element: protectedRolePage(<AdminEnterprisesPage />, superAdminOnly),
  },
  {
    path: "/admin/users",
    element: protectedRolePage(<AdminUsersPage />, adminRoles),
  },
  {
    path: "/admin/equipment-types",
    element: protectedRolePage(<AdminEquipmentTypesPage />, adminRoles),
  },
  {
    path: "/admin/equipment",
    element: protectedRolePage(<AdminEquipmentPage />, adminRoles),
  },
]);