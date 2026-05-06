import { apiClient } from "./axios";

export type AdminEquipmentSortOrder = "newest" | "oldest";

export type AdminEquipmentActiveFilter = "true" | "false" | "";

export type AdminEquipmentFilters = {
    search?: string;
    enterprise_id?: string;
    equipment_type_id?: string;
    is_active?: AdminEquipmentActiveFilter;
    sort_order?: AdminEquipmentSortOrder;
}

export type AdminEquipment = {
  id: number;
  equipment_code: string;
  name: string;
  location: string | null;
  is_active: boolean;
  enterprise_id: number;
  equipment_type_id: number;
  created_at: string;
  updated_at: string;
};

export type CreateAdminEquipmentRequest = {
  equipment_code: string;
  name: string;
  location: string | null;
  enterprise_id: number;
  equipment_type_id: number;
};

export type UpdateAdminEquipmentRequest = {
  equipment_code: string;
  name: string;
  location: string | null;
  enterprise_id: number;
  equipment_type_id: number;
  is_active: boolean;
};

export async function getAdminEquipmentRequest(
  filters: AdminEquipmentFilters = {}
): Promise<AdminEquipment[]> {
  const response = await apiClient.get("/equipment", {
    params: {
      search: filters.search || undefined,
      enterprise_id: filters.enterprise_id || undefined,
      equipment_type_id: filters.equipment_type_id || undefined,
      is_active: filters.is_active || undefined,
      sort_order: filters.sort_order || "newest",
    },
  });

  return response.data;
}

export async function createAdminEquipmentRequest(
  data: CreateAdminEquipmentRequest
): Promise<AdminEquipment> {
  const response = await apiClient.post("/equipment", data);
  return response.data;
}

export async function updateAdminEquipmentRequest(
  equipmentId: number,
  data: UpdateAdminEquipmentRequest
): Promise<AdminEquipment> {
  const response = await apiClient.put(`/equipment/${equipmentId}`, data);
  return response.data;
}

export async function activateAdminEquipmentRequest(
  equipmentId: number
): Promise<AdminEquipment> {
  const response = await apiClient.patch(`/equipment/${equipmentId}/activate`);
  return response.data;
}

export async function deactivateAdminEquipmentRequest(
  equipmentId: number
): Promise<AdminEquipment> {
  const response = await apiClient.patch(`/equipment/${equipmentId}/deactivate`);
  return response.data;
}