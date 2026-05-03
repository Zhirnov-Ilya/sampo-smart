import { apiClient } from "./axios";


export type LoginRequest = {
  email: string;
  password: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type CurrentUser = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  enterprise_id: number | null;
  enterprise_name: string | null;
  created_at: string;
  updated_at: string;
};


export async function loginRequest(data: LoginRequest): Promise<TokenResponse> {
  const response = await apiClient.post("/auth/login", data);
  return response.data;
}


export async function getMeRequest(): Promise<CurrentUser> {
  const response = await apiClient.get("/auth/me");
  return response.data;
}