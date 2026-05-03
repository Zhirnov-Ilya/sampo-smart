import { apiClient } from "./axios";

export type EquipmentType = {
    id: number;
    type_name: string;
    is_active: boolean;
};

export type EquipmentTypeCreate = {
    type_name: string;
};

export type EquipmentTypeUpdate = {
    type_name: string;
    is_active: boolean;
};

export async function getEquipmentTypes(): Promise<EquipmentType[]> {
    const response = await apiClient.get("/equipment-types");
    return response.data;
}

export async function createEquipmentType(
    data: EquipmentTypeCreate
): Promise<EquipmentType>{
    const response = await apiClient.post("/equipment-types", data);
    return response.data; 
}

export async function updateEquipmentType(
    id: number,
    data: EquipmentTypeUpdate
): Promise<EquipmentType>{
    const response = await apiClient.put(`/equipment-types/${id}`, data);
    return response.data;
}

export async function deactivateEquipmentType(id: number): Promise<EquipmentType>{
    const response = await apiClient.patch(`/equipment-types/${id}/deactivate`);
    return response.data;
}

export async function activateEquipmentType(id: number): Promise<EquipmentType>{
    const response = await apiClient.patch(`/equipment-types/${id}/activate`);
    return response.data;
}
