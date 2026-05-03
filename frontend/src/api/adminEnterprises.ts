import { apiClient } from "./axios";

export type AdminEnterprise = {
    id: number;
    name: string;
    industry: string | null;
    contact_email: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type CreateEnterpriseRequest = {
    name: string;
    industry: string | null;
    contact_email: string | null;
    is_active: boolean;
};

export type UpdateEnterpriseRequest = {
    name: string;
    industry: string | null;
    contact_email: string | null;
    is_active: boolean;
}

export async function getAdminEnterprisesRequest(): Promise<AdminEnterprise[]> {
    const response = await apiClient.get("/enterprises");
    return response.data;
}

export async function createEnterpriseRequest(
    data: CreateEnterpriseRequest
): Promise<AdminEnterprise> {
    const response = await apiClient.post("/enterprises", data);
    return response.data;
}

export async function updateEnterpriseRequest(
    enterpriseId: number,
    data: UpdateEnterpriseRequest
): Promise<AdminEnterprise> {
    const response = await apiClient.put(`/enterprises/${enterpriseId}`, data);
    return response.data;
}

export async function deactivateEnterpriseRequest(
    enterpriseId: number
): Promise<AdminEnterprise> {
    const response = await apiClient.patch(`/enterprises/${enterpriseId}/deactivate`);
    return response.data;
}

export async function activateEnterpriseRequest(
    enterpriseId: number
): Promise<AdminEnterprise> {
    const response = await apiClient.patch(`/enterprises/${enterpriseId}/activate`);
    return response.data;
}
