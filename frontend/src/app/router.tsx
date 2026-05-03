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
import {AdminUsersPage} from "../pages/AdminUsersPage";


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
    element: (
      <ProtectedRoute>
        <AppLayout>
          <DashboardPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/equipment",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <EquipmentPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/downtimes",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <DowntimesPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/hypotheses",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <HypothesesPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/hypotheses/:id",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <HypothesisDetailsPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/enterprises",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <AdminEnterprisesPage/>
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <AdminUsersPage/>
        </AppLayout>
      </ProtectedRoute>
    )
  }
]);