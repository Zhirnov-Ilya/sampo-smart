import { apiClient } from "./axios";

export type AdminEquipmentType = {
  id: number;
  type_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateEquipmentTypeRequest = {
  type_name: string;
};

export type UpdateEquipmentTypeRequest = {
  type_name: string;
  is_active: boolean;
};

export async function getAdminEquipmentTypesRequest(): Promise<AdminEquipmentType[]> {
  const response = await apiClient.get("/equipment-types");
  return response.data;
}

export async function createEquipmentTypeRequest(
  data: CreateEquipmentTypeRequest
): Promise<AdminEquipmentType> {
  const response = await apiClient.post("/equipment-types", data);
  return response.data;
}

export async function updateEquipmentTypeRequest(
  equipmentTypeId: number,
  data: UpdateEquipmentTypeRequest
): Promise<AdminEquipmentType> {
  const response = await apiClient.put(
    `/equipment-types/${equipmentTypeId}`,
    data
  );
  return response.data;
}

export async function activateEquipmentTypeRequest(
  equipmentTypeId: number
): Promise<AdminEquipmentType> {
  const response = await apiClient.patch(
    `/equipment-types/${equipmentTypeId}/activate`
  );
  return response.data;
}

export async function deactivateEquipmentTypeRequest(
  equipmentTypeId: number
): Promise<AdminEquipmentType> {
  const response = await apiClient.patch(
    `/equipment-types/${equipmentTypeId}/deactivate`
  );
  return response.data;
}