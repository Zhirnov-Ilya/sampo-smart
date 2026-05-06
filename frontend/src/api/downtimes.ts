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

export type UpdateDowntimeRequest = {
  equipment_id: number;
  start_time: string;
  end_time: string;
  reason_category: string | null;
  reason_details: string | null;
  production_loss_units: number | null;
  cost_impact_rub: number | null;
  reported_by: string | null;
};

export type DowntimeSortOrder = "newest" | "oldest";

export type DowntimeFilters = {
  search?: string;
  equipment_id?: string;
  reason_category?: string;
  start_from?: string;
  start_to?: string;
  sort_order?: DowntimeSortOrder;
};

export async function getDowntimesRequest(
  filters: DowntimeFilters = {}
): Promise<Downtime[]> {
  const response = await apiClient.get("/downtimes", {
    params: {
      search: filters.search || undefined,
      equipment_id: filters.equipment_id || undefined,
      reason_category: filters.reason_category || undefined,
      start_from: filters.start_from || undefined,
      start_to: filters.start_to || undefined,
      sort_order: filters.sort_order || "newest",
    },
  });

  return response.data;
}

export async function createDowntimeRequest(
  data: CreateDowntimeRequest
): Promise<Downtime> {
  const response = await apiClient.post("/downtimes", data);

  return response.data;
}

export async function updateDowntimeRequest({
  downtimeId,
  data,
}: {
  downtimeId: number;
  data: UpdateDowntimeRequest;
}): Promise<Downtime> {
  const response = await apiClient.put(`/downtimes/${downtimeId}`, data);

  return response.data;
}

export async function deleteDowntimeRequest(
  downtimeId: number
): Promise<void> {
  await apiClient.delete(`/downtimes/${downtimeId}`);
}