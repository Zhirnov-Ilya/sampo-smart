import { z } from "zod";

export const adminEquipmentCreateSchema = z.object({
  equipment_code: z.string().min(1, "Код оборудования обязателен"),
  name: z.string().min(1, "Название оборудования обязательно"),
  location: z.string().optional(),
  enterprise_id: z.string().min(1, "Выберите предприятие"),
  equipment_type_id: z.string().min(1, "Выберите тип оборудования"),
  is_active: z.boolean(),
});

export type AdminEquipmentFormValues = z.infer<
  typeof adminEquipmentCreateSchema
>;