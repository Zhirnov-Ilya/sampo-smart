import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";

import {
  createDowntimeRequest,
  getDowntimesRequest,
  updateDowntimeRequest,
  deleteDowntimeRequest,
  type DowntimeFilters,
} from "../../api/downtimes";

export function useDowntimes(filters: DowntimeFilters) {
  return useQuery({
    queryKey: ["downtimes", filters],
    queryFn: () => getDowntimesRequest(filters),
    placeholderData: keepPreviousData,
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

export function useUpdateDowntime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDowntimeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["downtimes"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
      queryClient.invalidateQueries({ queryKey: ["hypotheses"] });
    }
  });
}

export function useDeleteDowntime(){
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDowntimeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["downtimes"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
      queryClient.invalidateQueries({ queryKey: ["hypotheses"] });
    },
  });
}