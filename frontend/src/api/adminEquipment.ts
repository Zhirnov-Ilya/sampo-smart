import { apiClient } from "./axios";

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

export async function getAdminEquipmentRequest(): Promise<AdminEquipment[]> {
  const response = await apiClient.get("/equipment");
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