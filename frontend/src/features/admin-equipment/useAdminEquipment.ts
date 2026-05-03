import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  activateAdminEquipmentRequest,
  createAdminEquipmentRequest,
  deactivateAdminEquipmentRequest,
  getAdminEquipmentRequest,
  updateAdminEquipmentRequest,
} from "../../api/adminEquipment";

export function useAdminEquipment() {
  return useQuery({
    queryKey: ["admin-equipment"],
    queryFn: getAdminEquipmentRequest,
  });
}

export function useCreateAdminEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdminEquipmentRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-equipment"] });
    },
  });
}

export function useUpdateAdminEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      equipmentId,
      data,
    }: {
      equipmentId: number;
      data: {
        equipment_code: string;
        name: string;
        location: string | null;
        enterprise_id: number;
        equipment_type_id: number;
        is_active: boolean;
      };
    }) => updateAdminEquipmentRequest(equipmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-equipment"] });
    },
  });
}

export function useActivateAdminEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateAdminEquipmentRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-equipment"] });
    },
  });
}

export function useDeactivateAdminEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateAdminEquipmentRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-equipment"] });
    },
  });
}