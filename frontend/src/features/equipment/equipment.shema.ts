import { z } from "zod";

export const equipmentSchema = z.object({
  equipment_code: z.string().min(1, "Код оборудования обязателен"),
  name: z.string().min(1, "Название обязательно"),
  location: z.string().optional(),
  enterprise_id: z.string().min(1, "Укажите enterprise_id"),
  equipment_type_id: z.string().min(1, "Выберите тип оборудования"),
});

export type EquipmentFormValues = z.infer<typeof equipmentSchema>;