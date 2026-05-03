import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
    getAdminUsersRequest,
    createUserRequest,
    updateUserRequest,
    activateUserRequest,
    deactivateUserRequest,
    resetPasswordRequest,
} from "../../api/adminUsers";

export function useAdminUsers() {
    return useQuery({
        queryKey: ["admin-users"],
        queryFn: getAdminUsersRequest, 
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createUserRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, data, }: {
            userId: number;
            data: {
                full_name: string;
                email: string;
                role: string;
                is_active: boolean;
                enterprise_id: number | null;
            };
        }) => updateUserRequest(userId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"]});
        },
    });
}

export function useActivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: activateUserRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"]});
        },
    });
}

export function useDeactivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deactivateUserRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"]});
        },
    });
}

export function useResetUserPassword() {
    return useMutation({
        mutationFn: ({ userId, data}: {
            userId: number;
            data: {
                new_password: string;
            };
        }) => resetPasswordRequest(userId, data),
    });
}