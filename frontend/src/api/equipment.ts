import { apiClient } from "./axios";

export type EquipmentType = {
  id: number;
  type_name: string;
  created_at: string;
  updated_at: string;
};

export type Equipment = {
  id: number;
  equipment_code: string;
  name: string;
  location: string | null;
  enterprise_id: number;
  equipment_type_id: number;
  created_at: string;
  updated_at: string;
};

export type CreateEquipmentRequest = {
  equipment_code: string;
  name: string;
  location: string | null;
  enterprise_id: number;
  equipment_type_id: number;
};

export async function getEquipmentTypesRequest(): Promise<EquipmentType[]> {
  const response = await apiClient.get("/equipment-types");
  return response.data;
}

export async function getEquipmentListRequest(): Promise<Equipment[]> {
  const response = await apiClient.get("/equipment");
  return response.data;
}

export async function createEquipmentRequest(
  data: CreateEquipmentRequest
): Promise<Equipment> {
  const response = await apiClient.post("/equipment", data);
  return response.data;
}