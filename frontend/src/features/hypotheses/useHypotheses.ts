import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  generateHypothesisRequest,
  getHypothesesRequest,
  getHypothesisByIdRequest,
  updateHypothesisStatusRequest,
} from "../../api/hypotheses";

export function useHypotheses() {
  return useQuery({
    queryKey: ["hypotheses"],
    queryFn: getHypothesesRequest,
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