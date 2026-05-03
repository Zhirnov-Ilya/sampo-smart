import { useQuery } from "@tanstack/react-query";

import { getAnalyticsSummaryRequest } from "../../api/analytics";

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ["analytics-summary"],
    queryFn: getAnalyticsSummaryRequest,
  });
}