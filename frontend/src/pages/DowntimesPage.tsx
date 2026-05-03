import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useEquipmentList } from "../features/equipment/useEquipment";
import { useMe } from "../features/auth/useMe";
import {
  useCreateDowntime,
  useDowntimes,
} from "../features/downtimes/useDowntimes";
import { downtimeSchema } from "../features/downtimes/downtime.schema";
import type { DowntimeFormValues } from "../features/downtimes/downtime.schema";

import { PageLoader } from "../components/PageLoader";
import { SectionHeader } from "../components/SectionHeader";
import { EmptyState } from "../components/EmptyState";
import { formatDateTime, formatMoney } from "../utils/format";


export function DowntimesPage() {
  const { data: user } = useMe();
  const { data: downtimes, isLoading, isError } = useDowntimes();
  const { data: equipmentList } = useEquipmentList();
  const createDowntimeMutation = useCreateDowntime();

  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DowntimeFormValues>({
    resolver: zodResolver(downtimeSchema),
    defaultValues: {
      equipment_id: "",
      start_time: "",
      end_time: "",
      reason_category: "",
      reason_details: "",
      production_loss_units: "",
      cost_impact_rub: "",
      reported_by: user?.full_name ?? "",
    },
  });

  useEffect(() => {
    if (user?.full_name) {
      setValue("reported_by", user.full_name);
    }
  }, [user, setValue]);

  const onSubmit = async (data: DowntimeFormValues) => {
    try {
      setServerError("");

      await createDowntimeMutation.mutateAsync({
        equipment_id: Number(data.equipment_id),
        start_time: data.start_time,
        end_time: data.end_time,
        reason_category: data.reason_category || null,
        reason_details: data.reason_details || null,
        production_loss_units: data.production_loss_units
          ? Number(data.production_loss_units)
          : null,
        cost_impact_rub: data.cost_impact_rub
          ? Number(data.cost_impact_rub)
          : null,
        reported_by: data.reported_by || null,
      });

      reset({
        equipment_id: "",
        start_time: "",
        end_time: "",
        reason_category: "",
        reason_details: "",
        production_loss_units: "",
        cost_impact_rub: "",
        reported_by: user?.full_name ?? "",
      });
    } catch (error: any) {
      setServerError(
        error?.response?.data?.detail || "Не удалось создать простой"
      );
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !downtimes) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Downtimes
        </Typography>
        <Typography variant="body1">
          Не удалось загрузить список простоев.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <SectionHeader
        title="Простои"
        subtitle="Регистрация простоев оборудования и просмотр истории инцидентов"
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h3" gutterBottom>
              Список простоев
            </Typography>

            {downtimes.length === 0 ? (
              <EmptyState
                title="Простои пока отсутствуют"
                description="Добавь первый простой через форму справа."
              />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {downtimes.map((item) => {
                  const equipmentName =
                    equipmentList?.find(
                      (equipment) => equipment.id === item.equipment_id
                    )?.name || `ID ${item.equipment_id}`;

                  return (
                    <Paper
                      key={item.id}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        backgroundColor: "#FAFBFC",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 2,
                          mb: 1,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 600, mb: 0.5 }}
                          >
                            Простой #{item.id}
                          </Typography>

                          <Typography variant="body2">
                            Оборудование: {equipmentName}
                          </Typography>
                        </Box>

                        <Typography variant="caption">
                          Equipment ID: {item.equipment_id}
                        </Typography>
                      </Box>

                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Начало: {formatDateTime(item.start_time)}
                      </Typography>

                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Окончание: {formatDateTime(item.end_time)}
                      </Typography>

                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Длительность: {item.duration_minutes} мин.
                      </Typography>

                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Категория: {item.reason_category || "—"}
                      </Typography>

                      <Typography variant="body2">
                        Ущерб: {formatMoney(item.cost_impact_rub)}
                      </Typography>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h3" gutterBottom>
              Добавить простой
            </Typography>

            {serverError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {serverError}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              <TextField
                label="Оборудование"
                select
                defaultValue=""
                {...register("equipment_id")}
                error={!!errors.equipment_id}
                helperText={errors.equipment_id?.message}
              >
                <MenuItem value="">Выберите оборудование</MenuItem>
                {equipmentList?.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>
                    {item.name} ({item.equipment_code})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Время начала"
                type="datetime-local"
                slotProps={{ inputLabel: { shrink: true } }}
                {...register("start_time")}
                error={!!errors.start_time}
                helperText={errors.start_time?.message}
              />

              <TextField
                label="Время окончания"
                type="datetime-local"
                slotProps={{ inputLabel: { shrink: true } }}
                {...register("end_time")}
                error={!!errors.end_time}
                helperText={errors.end_time?.message}
              />

              <TextField
                label="Категория причины"
                {...register("reason_category")}
                error={!!errors.reason_category}
                helperText={errors.reason_category?.message}
              />

              <TextField
                label="Описание причины"
                multiline
                minRows={3}
                {...register("reason_details")}
                error={!!errors.reason_details}
                helperText={errors.reason_details?.message}
              />

              <TextField
                label="Потери производства"
                {...register("production_loss_units")}
                error={!!errors.production_loss_units}
                helperText={errors.production_loss_units?.message}
              />

              <TextField
                label="Ущерб, ₽"
                {...register("cost_impact_rub")}
                error={!!errors.cost_impact_rub}
                helperText={errors.cost_impact_rub?.message}
              />

              <TextField
                label="Кто сообщил"
                {...register("reported_by")}
                error={!!errors.reported_by}
                helperText={errors.reported_by?.message}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting || createDowntimeMutation.isPending}
              >
                {isSubmitting || createDowntimeMutation.isPending
                  ? "Сохранение..."
                  : "Создать"}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}