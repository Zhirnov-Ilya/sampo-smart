import { z } from "zod";

export const downtimeSchema = z
  .object({
    equipment_id: z.string().min(1, "Выберите оборудование"),
    start_time: z.string().min(1, "Укажите время начала"),
    end_time: z.string().min(1, "Укажите время окончания"),
    reason_category: z.string().optional(),
    reason_details: z.string().optional(),
    production_loss_units: z.string().optional(),
    cost_impact_rub: z.string().optional(),
    reported_by: z.string().optional(),
  })
  .refine((data) => new Date(data.end_time) > new Date(data.start_time), {
    message: "Время окончания должно быть больше времени начала",
    path: ["end_time"],
  });

export type DowntimeFormValues = z.infer<typeof downtimeSchema>;