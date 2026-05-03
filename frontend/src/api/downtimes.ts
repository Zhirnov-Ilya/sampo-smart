import { apiClient } from "./axios";

export type Downtime = {
  id: number;
  equipment_id: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  reason_category: string | null;
  reason_details: string | null;
  production_loss_units: number | null;
  cost_impact_rub: number | null;
  reported_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateDowntimeRequest = {
  equipment_id: number;
  start_time: string;
  end_time: string;
  reason_category: string | null;
  reason_details: string | null;
  production_loss_units: number | null;
  cost_impact_rub: number | null;
  reported_by: string | null;
};

export async function getDowntimesRequest(): Promise<Downtime[]> {
  const response = await apiClient.get("/downtimes");
  return response.data;
}

export async function createDowntimeRequest(
  data: CreateDowntimeRequest
): Promise<Downtime> {
  const response = await apiClient.post("/downtimes", data);
  return response.data;
}