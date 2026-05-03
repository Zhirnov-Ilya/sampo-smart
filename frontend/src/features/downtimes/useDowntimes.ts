import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createDowntimeRequest,
  getDowntimesRequest,
} from "../../api/downtimes";

export function useDowntimes() {
  return useQuery({
    queryKey: ["downtimes"],
    queryFn: getDowntimesRequest,
  });
}

export function useCreateDowntime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDowntimeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["downtimes"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
      queryClient.invalidateQueries({ queryKey: ["hypotheses"] });
    },
  });
}