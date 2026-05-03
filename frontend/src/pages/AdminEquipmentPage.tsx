import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAdminEnterprises } from "../features/admin-enterprises/useAdminEnterprises";
import { useAdminEquipmentTypes } from "../features/admin-equipment-types/useAdminEquipmentTypes";
import {
  useActivateAdminEquipment,
  useAdminEquipment,
  useCreateAdminEquipment,
  useDeactivateAdminEquipment,
  useUpdateAdminEquipment,
} from "../features/admin-equipment/useAdminEquipment";
import {
  adminEquipmentCreateSchema,
  type AdminEquipmentFormValues,
} from "../features/admin-equipment/adminEquipment.schema";
import { PageLoader } from "../components/PageLoader";
import { SectionHeader } from "../components/SectionHeader";
import { EmptyState } from "../components/EmptyState";
import { formatDateTime } from "../utils/format";

type EditMode = "create" | "edit";

export function AdminEquipmentPage() {
  const { data: equipment, isLoading, isError } = useAdminEquipment();
  const { data: enterprises } = useAdminEnterprises();
  const { data: equipmentTypes } = useAdminEquipmentTypes();

  const createMutation = useCreateAdminEquipment();
  const updateMutation = useUpdateAdminEquipment();
  const activateMutation = useActivateAdminEquipment();
  const deactivateMutation = useDeactivateAdminEquipment();

  const [serverError, setServerError] = useState("");
  const [mode, setMode] = useState<EditMode>("create");
  const [editingEquipmentId, setEditingEquipmentId] = useState<number | null>(null);

  const formRef = useRef<HTMLDivElement | null>(null);

  const form = useForm<AdminEquipmentFormValues>({
    resolver: zodResolver(adminEquipmentCreateSchema),
    defaultValues: {
      equipment_code: "",
      name: "",
      location: "",
      enterprise_id: "",
      equipment_type_id: "",
      is_active: true,
    },
  });

  const handleCreate = async (data: AdminEquipmentFormValues) => {
    try {
      setServerError("");

      await createMutation.mutateAsync({
        equipment_code: data.equipment_code,
        name: data.name,
        location: data.location || null,
        enterprise_id: Number(data.enterprise_id),
        equipment_type_id: Number(data.equipment_type_id),
      });

      form.reset({
        equipment_code: "",
        name: "",
        location: "",
        enterprise_id: "",
        equipment_type_id: "",
        is_active: true,
      });
    } catch (error: any) {
      setServerError(
        error?.response?.data?.detail || "Не удалось создать оборудование"
      );
    }
  };

  const handleUpdate = async (data: AdminEquipmentFormValues) => {
    if (!editingEquipmentId) return;

    try {
      setServerError("");

      await updateMutation.mutateAsync({
        equipmentId: editingEquipmentId,
        data: {
          equipment_code: data.equipment_code,
          name: data.name,
          location: data.location || null,
          enterprise_id: Number(data.enterprise_id),
          equipment_type_id: Number(data.equipment_type_id),
          is_active: data.is_active,
        },
      });

      setMode("create");
      setEditingEquipmentId(null);

      form.reset({
        equipment_code: "",
        name: "",
        location: "",
        enterprise_id: "",
        equipment_type_id: "",
        is_active: true,
      });
    } catch (error: any) {
      setServerError(
        error?.response?.data?.detail || "Не удалось обновить оборудование"
      );
    }
  };

  const handleEdit = (item: {
    id: number;
    equipment_code: string;
    name: string;
    location: string | null;
    enterprise_id: number;
    equipment_type_id: number;
    is_active: boolean;
  }) => {
    setMode("edit");
    setEditingEquipmentId(item.id);

    form.reset({
      equipment_code: item.equipment_code,
      name: item.name,
      location: item.location || "",
      enterprise_id: String(item.enterprise_id),
      equipment_type_id: String(item.equipment_type_id),
      is_active: item.is_active,
    });

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const handleCancelEdit = () => {
    setMode("create");
    setEditingEquipmentId(null);

    form.reset({
      equipment_code: "",
      name: "",
      location: "",
      enterprise_id: "",
      equipment_type_id: "",
      is_active: true,
    });
  };

  const handleDeactivate = async (equipmentId: number) => {
    await deactivateMutation.mutateAsync(equipmentId);
  };

  const handleActivate = async (equipmentId: number) => {
    await activateMutation.mutateAsync(equipmentId);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !equipment) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Управление оборудованием
        </Typography>
        <Typography variant="body1">
          Не удалось загрузить список оборудования.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box  ref={formRef}>
      <SectionHeader
        title="Оборудование (админ)"
        subtitle="Управление оборудованием предприятий"
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
                description="Создай первую единицу оборудования через форму справа."
              />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {equipment.map((item) => {
                  const enterpriseName =
                    enterprises?.find((e) => e.id === item.enterprise_id)?.name ??
                    `ID ${item.enterprise_id}`;

                  const equipmentTypeName =
                    equipmentTypes?.find((t) => t.id === item.equipment_type_id)?.type_name ??
                    `ID ${item.equipment_type_id}`;

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
                          mb: 1.5,
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

                        <Chip
                          label={item.is_active ? "Активно" : "Неактивно"}
                          color={item.is_active ? "success" : "default"}
                          size="small"
                        />
                      </Box>

                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Предприятие: {enterpriseName}
                      </Typography>

                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Тип: {equipmentTypeName}
                      </Typography>

                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Локация: {item.location || "—"}
                      </Typography>

                      <Typography variant="caption" sx={{ display: "block", mb: 2 }}>
                        Создано: {formatDateTime(item.created_at)}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => handleEdit(item)}
                        >
                          Редактировать
                        </Button>

                        {item.is_active ? (
                          <Button
                            variant="outlined"
                            color="warning"
                            onClick={() => handleDeactivate(item.id)}
                            disabled={deactivateMutation.isPending}
                          >
                            Деактивировать
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            color="success"
                            onClick={() => handleActivate(item.id)}
                            disabled={activateMutation.isPending}
                          >
                            Активировать
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Box>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h3" gutterBottom>
                {mode === "create"
                  ? "Добавить оборудование"
                  : "Редактировать оборудование"}
              </Typography>

              {serverError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {serverError}
                </Alert>
              )}

              <Box
                key={
                  mode === "create"
                    ? "create-admin-equipment-form"
                    : `edit-admin-equipment-form-${editingEquipmentId}`
                }
                component="form"
                onSubmit={form.handleSubmit(
                  mode === "create" ? handleCreate : handleUpdate
                )}
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <Controller
                  name="equipment_code"
                  control={form.control}
                  render={({ field }) => (
                    <TextField
                      label="Код оборудования"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      error={!!form.formState.errors.equipment_code}
                      helperText={form.formState.errors.equipment_code?.message}
                    />
                  )}
                />

                <Controller
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <TextField
                      label="Название оборудования"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      error={!!form.formState.errors.name}
                      helperText={form.formState.errors.name?.message}
                    />
                  )}
                />

                <Controller
                  name="location"
                  control={form.control}
                  render={({ field }) => (
                    <TextField
                      label="Локация"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      error={!!form.formState.errors.location}
                      helperText={form.formState.errors.location?.message}
                    />
                  )}
                />

                <Controller
                  name="enterprise_id"
                  control={form.control}
                  render={({ field }) => (
                    <TextField
                      label="Предприятие"
                      select
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      error={!!form.formState.errors.enterprise_id}
                      helperText={form.formState.errors.enterprise_id?.message}
                    >
                      <MenuItem value="">Выберите предприятие</MenuItem>
                      {enterprises?.map((enterprise) => (
                        <MenuItem key={enterprise.id} value={String(enterprise.id)}>
                          {enterprise.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <Controller
                  name="equipment_type_id"
                  control={form.control}
                  render={({ field }) => (
                    <TextField
                      label="Тип оборудования"
                      select
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      error={!!form.formState.errors.equipment_type_id}
                      helperText={form.formState.errors.equipment_type_id?.message}
                    >
                      <MenuItem value="">Выберите тип оборудования</MenuItem>
                      {equipmentTypes?.map((equipmentType) => (
                        <MenuItem key={equipmentType.id} value={String(equipmentType.id)}>
                          {equipmentType.type_name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <Controller
                  name="is_active"
                  control={form.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Активно"
                    />
                  )}
                />

                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={
                      form.formState.isSubmitting ||
                      createMutation.isPending ||
                      updateMutation.isPending
                    }
                  >
                    {mode === "create"
                      ? createMutation.isPending || form.formState.isSubmitting
                        ? "Создание..."
                        : "Создать"
                      : updateMutation.isPending || form.formState.isSubmitting
                      ? "Сохранение..."
                      : "Сохранить"}
                  </Button>

                  {mode === "edit" && (
                    <Button
                      type="button"
                      variant="outlined"
                      color="primary"
                      onClick={handleCancelEdit}
                    >
                      Отмена
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}