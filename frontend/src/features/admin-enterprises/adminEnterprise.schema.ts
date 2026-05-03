import { z } from "zod";

export const adminEnterpriseSchema = z.object({
    name: z.string().min(1, "Название предприятия обязательно!"),
    industry: z.string().optional(),
    contact_email: z
        .string()
        .optional()
        .refine((value) => !value || /\S+@\S+\.\S+/.test(value), {message: "Введите корректный email",}),
    is_active: z.boolean(),
});

export type AdminEnterpriseFormValues = z.infer<typeof adminEnterpriseSchema>;