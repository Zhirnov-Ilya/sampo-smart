import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  activateEquipmentTypeRequest,
  createEquipmentTypeRequest,
  deactivateEquipmentTypeRequest,
  getAdminEquipmentTypesRequest,
  updateEquipmentTypeRequest,
} from "../../api/adminEquipmentsTypes";

export function useAdminEquipmentTypes() {
  return useQuery({
    queryKey: ["admin-equipment-types"],
    queryFn: getAdminEquipmentTypesRequest,
  });
}

export function useCreateEquipmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEquipmentTypeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-equipment-types"] });
    },
  });
}

export function useUpdateEquipmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      equipmentTypeId,
      data,
    }: {
      equipmentTypeId: number;
      data: {
        type_name: string;
        is_active: boolean;
      };
    }) => updateEquipmentTypeRequest(equipmentTypeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-equipment-types"] });
    },
  });
}

export function useActivateEquipmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateEquipmentTypeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-equipment-types"] });
    },
  });
}

export function useDeactivateEquipmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateEquipmentTypeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-equipment-types"] });
    },
  });
}