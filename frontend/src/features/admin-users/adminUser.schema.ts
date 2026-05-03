import { z } from "zod";

export const adminUserCreateSchema = z.object({
    full_name: z.string().min(1, "ФИО обязательно!"),
    email: z
        .string()
        .min(1, "Email обязателен!")
        .refine((value) => /\S+@\S+\.\S+/.test(value), {message: "Введите корректный email!",}),
    password: z.string().min(6, "Пароль должен быть не короче 6 символов"),
    role: z.string().min(1, "Выберите роль!"),
    is_active: z.boolean(),
    enterprise_id: z.string().optional(),
});

export const adminUserUpdateSchema = z.object({
  full_name: z.string().min(1, "ФИО обязательно!"),
  email: z.email({ message: "Введите корректный email!" }),
  role: z.string().min(1, "Выберите роль!"),
  is_active: z.boolean(),
  enterprise_id: z.string().optional(),
});

export const resetPasswordSchema = z.object({
    new_password: z.string().min(6, "Пароль должен быть не короче 6 символов"),
});

export type AdminUserCreateFormValues = z.infer<typeof adminUserCreateSchema>;
export type AdminUserUpdateFormValues = z.infer<typeof adminUserUpdateSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;