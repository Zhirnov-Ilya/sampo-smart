import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";

import {
    activateEnterpriseRequest,
    createEnterpriseRequest,
    deactivateEnterpriseRequest,
    getAdminEnterprisesRequest,
    updateEnterpriseRequest,
    type AdminEnterpriseFilters
} from "../../api/adminEnterprises";

export function useAdminEnterprises(filters: AdminEnterpriseFilters = {}) {
    return useQuery({
        queryKey: ["admin-enterprises", filters],
        queryFn: () => getAdminEnterprisesRequest(filters),
        placeholderData: keepPreviousData,
    });
}

export function useCreateEnterprise() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createEnterpriseRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-enterprises"] });
        },
    });
}

export function useUpdateEnterprise() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ enterpriseId, data, }: {
            enterpriseId: number;
            data: {
                name: string;
                industry: string | null;
                contact_email: string | null;
                is_active: boolean;
            };
        }) => updateEnterpriseRequest(enterpriseId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-enterprises"] });
        },
    });
}

export function useActivateEnterprise() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: activateEnterpriseRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-enterprises"]} );
        },
    });
}

export function useDeactivateEnterprise() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deactivateEnterpriseRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-enterprises"] });
        },
    });
}