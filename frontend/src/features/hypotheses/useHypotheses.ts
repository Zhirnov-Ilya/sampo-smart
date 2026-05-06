import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";

import {
  deleteHypothesisRequest,
  generateHypothesisRequest,
  getHypothesisByIdRequest,
  getHypothesesRequest,
  updateHypothesisStatusRequest,
  type HypothesisFilters,
} from "../../api/hypotheses";

export function useHypotheses(filters: HypothesisFilters = {}) {
  return useQuery({
    queryKey: ["hypotheses", filters],
    queryFn: () => getHypothesesRequest(filters),
    placeholderData: keepPreviousData,
  });
}

export function useHypothesisById(hypothesisId: number) {
  return useQuery({
    queryKey: ["hypothesis", hypothesisId],
    queryFn: () => getHypothesisByIdRequest(hypothesisId),
    enabled: !!hypothesisId,
  });
}

export function useGenerateHypothesis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateHypothesisRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hypotheses"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
    },
  });
}

export function useUpdateHypothesisStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      hypothesisId,
      status,
    }: {
      hypothesisId: number;
      status: string;
    }) => updateHypothesisStatusRequest(hypothesisId, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["hypotheses"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
      queryClient.invalidateQueries({
        queryKey: ["hypothesis", variables.hypothesisId],
      });
    },
  });
}

export function useDeleteHypothesis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHypothesisRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hypotheses"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
    },
  });
}