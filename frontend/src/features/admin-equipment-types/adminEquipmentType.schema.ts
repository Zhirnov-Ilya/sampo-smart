import { z } from "zod";

export const adminEquipmentTypeSchema = z.object({
  type_name: z.string().min(1, "Название типа оборудования обязательно"),
  is_active: z.boolean(),
});

export type AdminEquipmentTypeFormValues = z.infer<
  typeof adminEquipmentTypeSchema
>;
