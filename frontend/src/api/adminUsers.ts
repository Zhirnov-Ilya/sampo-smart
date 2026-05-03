import { apiClient } from "./axios";

export type AdminUser = {
    id: number;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
    enterprise_id: number | null;
    created_at: string;
    updated_at: string;
};

export type CreateUserRequest = {
    full_name: string;
    email: string;
    password: string;
    role: string;
    is_active: boolean;
    enterprise_id: number | null;
};

export type UpdateUserRequest = {
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
    enterprise_id: number | null;
};

export type ResetPasswordRequest = {
    new_password: string;
};

export async function getAdminUsersRequest(): Promise<AdminUser[]> {
    const response = await apiClient.get("/users");
    return response.data;
}

export async function createUserRequest(
    data: CreateUserRequest
): Promise<AdminUser> {
    const response = await apiClient.post("/users", data);
    return response.data;
}

export async function updateUserRequest(
    userId: number,
    data: UpdateUserRequest
): Promise<AdminUser> {
    const response = await apiClient.put(`/users/${userId}`, data);
    return response.data;
}

export async function activateUserRequest(
    userId: number
): Promise<AdminUser> {
    const response = await apiClient.patch(`/users/${userId}/activate`);
    return response.data; 
}

export async function deactivateUserRequest(
    userId: number
): Promise<AdminUser>{
    const response = await apiClient.patch(`/users/${userId}/deactivate`);
    return response.data;
}

export async function resetPasswordRequest(
    userId: number,
    data: ResetPasswordRequest
): Promise<AdminUser>{
    const response = await apiClient.post(`/users/${userId}/reset-password`, data);
    return response.data;
}
