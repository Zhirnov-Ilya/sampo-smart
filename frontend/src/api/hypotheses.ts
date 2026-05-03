import { apiClient } from "./axios";

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

export async function getHypothesesRequest(): Promise<Hypothesis[]> {
  const response = await apiClient.get("/hypotheses");
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