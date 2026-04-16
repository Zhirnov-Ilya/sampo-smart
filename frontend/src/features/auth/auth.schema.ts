import { z } from "zod";


export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email обязателен")
    .email("Введите корректный email"),
  password: z
    .string()
    .min(1, "Пароль обязателен")
    .min(6, "Пароль должен быть не короче 6 символов"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;