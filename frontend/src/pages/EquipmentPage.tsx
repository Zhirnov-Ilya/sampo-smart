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

import { useMe } from "../features/auth/useMe";
import {
  useCreateEquipment,
  useEquipmentList,
  useEquipmentTypes,
} from "../features/equipment/useEquipment";
import { equipmentSchema } from "../features/equipment/equipment.shema";
import type { EquipmentFormValues } from "../features/equipment/equipment.shema";
import { PageLoader } from "../components/PageLoader";
import { SectionHeader } from "../components/SectionHeader";
import { EmptyState } from "../components/EmptyState";


export function EquipmentPage() {
  const { data: user } = useMe();
  const { data: equipment, isLoading, isError } = useEquipmentList();
  const { data: equipmentTypes } = useEquipmentTypes();
  const createEquipmentMutation = useCreateEquipment();

  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      equipment_code: "",
      name: "",
      location: "",
      enterprise_id: user?.enterprise_id ? String(user.enterprise_id) : "",
      equipment_type_id: "",
    },
  });

  useEffect(() => {
    if (user?.enterprise_id) {
      setValue("enterprise_id", String(user.enterprise_id));
    }
  }, [user, setValue]);

  const onSubmit = async (data: EquipmentFormValues) => {
    try {
      setServerError("");

      await createEquipmentMutation.mutateAsync({
        equipment_code: data.equipment_code,
        name: data.name,
        location: data.location || null,
        enterprise_id: Number(data.enterprise_id),
        equipment_type_id: Number(data.equipment_type_id),
      });

      reset({
        equipment_code: "",
        name: "",
        location: "",
        enterprise_id: user?.enterprise_id ? String(user.enterprise_id) : "",
        equipment_type_id: "",
      });
    } catch (error: any) {
      setServerError(
        error?.response?.data?.detail || "Не удалось создать оборудование"
      );
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !equipment) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Equipment
        </Typography>
        <Typography variant="body1">
          Не удалось загрузить список оборудования.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <SectionHeader
        title="Оборудование"
        subtitle="Реестр оборудования предприятия и создание новых единиц оборудования"
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h3" gutterBottom>
              Список оборудования
            </Typography>

            {equipment.length === 0 ? (
              <EmptyState
                title="Оборудование пока отсутствует"
                description="Добавь первую единицу оборудования через форму справа."
              />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {equipment.map((item) => {
                  const equipmentTypeName =
                    equipmentTypes?.find(
                      (type) => type.id === item.equipment_type_id
                    )?.type_name || `ID ${item.equipment_type_id}`;

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
                            {item.name}
                          </Typography>

                          <Typography variant="body2">
                            Код: {item.equipment_code}
                          </Typography>
                        </Box>

                        <Typography variant="caption">
                          Equipment ID: {item.id}
                        </Typography>
                      </Box>

                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Тип: {equipmentTypeName}
                      </Typography>

                      <Typography variant="body2">
                        Локация: {item.location || "—"}
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
              Добавить оборудование
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
                label="Код оборудования"
                {...register("equipment_code")}
                error={!!errors.equipment_code}
                helperText={errors.equipment_code?.message}
              />

              <TextField
                label="Название"
                {...register("name")}
                error={!!errors.name}
                helperText={errors.name?.message}
              />

              <TextField
                label="Локация"
                {...register("location")}
                error={!!errors.location}
                helperText={errors.location?.message}
              />

              <TextField
                label="Тип оборудования"
                select
                defaultValue=""
                {...register("equipment_type_id")}
                error={!!errors.equipment_type_id}
                helperText={errors.equipment_type_id?.message}
              >
                <MenuItem value="">Выберите тип</MenuItem>
                {equipmentTypes?.map((type) => (
                  <MenuItem key={type.id} value={String(type.id)}>
                    {type.type_name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Enterprise ID"
                {...register("enterprise_id")}
                error={!!errors.enterprise_id}
                helperText={errors.enterprise_id?.message}
                disabled={user?.role !== "super_admin"}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting || createEquipmentMutation.isPending}
              >
                {isSubmitting || createEquipmentMutation.isPending
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