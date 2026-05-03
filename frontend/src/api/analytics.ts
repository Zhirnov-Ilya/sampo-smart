import { apiClient } from "./axios";

export type AnalyticsSummary = {
  equipment_count: number;
  downtime_count: number;
  hypothesis_count: number;
  accepted_hypothesis_count: number;
  total_cost_impact_rub: number;
};

export async function getAnalyticsSummaryRequest(): Promise<AnalyticsSummary> {
  const response = await apiClient.get("/analytics/summary");
  return response.data;
}