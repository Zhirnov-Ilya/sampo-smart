import { apiClient } from "./axios";

export type HypothesisSortOrder = "newest" | "oldest";

export type HypothesisPriorityFilter = "" | "high" | "medium" | "low";

export type HypothesisFilters = {
  
  search?: string;
  status?: string;
  priority?: string;
  downtime_id?: string;
  sort_order?: HypothesisSortOrder;

};

export type Hypothesis = {
  id: number;
  downtime_id: number;
  title: string;
  problem_description: string;
  root_cause: string | null;
  suggested_action: string;
  expected_downtime_reduction_hours: number | null;
  expected_cost_savings_rub: number | null;
  implementation_cost_rub: number | null;
  implementation_time_days: number | null;
  priority_score: number | null;
  status: string;
  risks: string[] | null;
  data_sources: string[] | null;
  similar_cases: string[] | null;
  created_at: string;
  updated_at: string;
};

export type UpdateHypothesisStatusRequest = {
  status: string;
};

export async function getHypothesesRequest(
  filters: HypothesisFilters = {}
): Promise<Hypothesis[]> {
  const response = await apiClient.get("/hypotheses", {
    params: {
      search: filters.search || undefined,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      downtime_id: filters.downtime_id || undefined,
      sort_order: filters.sort_order || "newest",
    },
  });

  return response.data;
}

export async function generateHypothesisRequest(
  downtimeId: number
): Promise<Hypothesis> {
  const response = await apiClient.post(`/hypotheses/generate/${downtimeId}`);
  return response.data;
}

export async function updateHypothesisStatusRequest(
  hypothesisId: number,
  data: UpdateHypothesisStatusRequest
): Promise<Hypothesis> {
  const response = await apiClient.put(
    `/hypotheses/${hypothesisId}/status`,
    data
  );
  return response.data;
}

export async function getHypothesisByIdRequest(
  hypothesisId: number
): Promise<Hypothesis> {
  const response = await apiClient.get(`/hypotheses/${hypothesisId}`);
  return response.data;
}

export async function deleteHypothesisRequest(
  hypothesisId: number
): Promise<void> {
  await apiClient.delete(`/hypotheses/${hypothesisId}`);
}