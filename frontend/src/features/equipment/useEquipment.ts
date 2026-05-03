import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createEquipmentRequest,
  getEquipmentListRequest,
  getEquipmentTypesRequest,
} from "../../api/equipment";

export function useEquipmentList() {
  return useQuery({
    queryKey: ["equipment"],
    queryFn: getEquipmentListRequest,
  });
}

export function useEquipmentTypes() {
  return useQuery({
    queryKey: ["equipment-types"],
    queryFn: getEquipmentTypesRequest,
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEquipmentRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
  });
}