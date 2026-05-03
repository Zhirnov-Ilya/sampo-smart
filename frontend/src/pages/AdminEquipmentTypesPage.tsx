import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  useActivateEquipmentType,
  useAdminEquipmentTypes,
  useCreateEquipmentType,
  useDeactivateEquipmentType,
  useUpdateEquipmentType,
} from "../features/admin-equipment-types/useAdminEquipmentTypes";
import {
  adminEquipmentTypeSchema,
  type AdminEquipmentTypeFormValues,
} from "../features/admin-equipment-types/adminEquipmentType.schema";
import { PageLoader } from "../components/PageLoader";
import { SectionHeader } from "../components/SectionHeader";
import { EmptyState } from "../components/EmptyState";
import { formatDateTime } from "../utils/format";

type EditMode = "create" | "edit";

export function AdminEquipmentTypesPage() {
  const { data: equipmentTypes, isLoading, isError } =
    useAdminEquipmentTypes();

  const createMutation = useCreateEquipmentType();
  const updateMutation = useUpdateEquipmentType();
  const activateMutation = useActivateEquipmentType();
  const deactivateMutation = useDeactivateEquipmentType();

  const [serverError, setServerError] = useState("");
  const [mode, setMode] = useState<EditMode>("create");
  const [editingEquipmentTypeId, setEditingEquipmentTypeId] = useState<number | null>(null);

  const form = useForm<AdminEquipmentTypeFormValues>({
    resolver: zodResolver(adminEquipmentTypeSchema),
    defaultValues: {
      type_name: "",
      is_active: true,
    },
  });

  const handleCreate = async (data: AdminEquipmentTypeFormValues) => {
    try {
      setServerError("");

      await createMutation.mutateAsync({
        type_name: data.type_name,
      });

      form.reset({
        type_name: "",
        is_active: true,
      });
    } catch (error: any) {
      setServerError(
        error?.response?.data?.detail || "Не удалось создать тип оборудования"
      );
    }
  };

  const handleUpdate = async (data: AdminEquipmentTypeFormValues) => {
    if (!editingEquipmentTypeId) return;

    try {
      setServerError("");

      await updateMutation.mutateAsync({
        equipmentTypeId: editingEquipmentTypeId,
        data: {
          type_name: data.type_name,
          is_active: data.is_active,
        },
      });

      setMode("create");
      setEditingEquipmentTypeId(null);

      form.reset({
        type_name: "",
        is_active: true,
      });
    } catch (error: any) {
      setServerError(
        error?.response?.data?.detail || "Не удалось обновить тип оборудования"
      );
    }
  };

  const handleEdit = (equipmentType: {
    id: number;
    type_name: string;
    is_active: boolean;
  }) => {
    setMode("edit");
    setEditingEquipmentTypeId(equipmentType.id);

    form.reset({
      type_name: equipmentType.type_name,
      is_active: equipmentType.is_active,
    });
  };

  const handleCancelEdit = () => {
    setMode("create");
    setEditingEquipmentTypeId(null);

    form.reset({
      type_name: "",
      is_active: true,
    });
  };

  const handleDeactivate = async (equipmentTypeId: number) => {
    await deactivateMutation.mutateAsync(equipmentTypeId);
  };

  const handleActivate = async (equipmentTypeId: number) => {
    await activateMutation.mutateAsync(equipmentTypeId);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !equipmentTypes) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Типы оборудования
        </Typography>
        <Typography variant="body1">
          Не удалось загрузить типы оборудования.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <SectionHeader
        title="Типы оборудования"
        subtitle="Управление глобальным справочником типов оборудования"
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h3" gutterBottom>
              Список типов оборудования
            </Typography>

            {equipmentTypes.length === 0 ? (
              <EmptyState
                title="Типы оборудования пока отсутствуют"
                description="Создай первый тип оборудования через форму справа."
              />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {equipmentTypes.map((equipmentType) => (
                  <Paper
                    key={equipmentType.id}
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
                          {equipmentType.type_name}
                        </Typography>

                        <Typography variant="body2">
                          Equipment Type ID: {equipmentType.id}
                        </Typography>
                      </Box>

                      <Chip
                        label={equipmentType.is_active ? "Активен" : "Неактивен"}
                        color={equipmentType.is_active ? "success" : "default"}
                        size="small"
                      />
                    </Box>

                    <Typography variant="caption" sx={{ display: "block", mb: 2 }}>
                      Создан: {formatDateTime(equipmentType.created_at)}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleEdit(equipmentType)}
                      >
                        Редактировать
                      </Button>

                      {equipmentType.is_active ? (
                        <Button
                          variant="outlined"
                          color="warning"
                          onClick={() => handleDeactivate(equipmentType.id)}
                          disabled={deactivateMutation.isPending}
                        >
                          Деактивировать
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          color="success"
                          onClick={() => handleActivate(equipmentType.id)}
                          disabled={activateMutation.isPending}
                        >
                          Активировать
                        </Button>
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h3" gutterBottom>
              {mode === "create"
                ? "Добавить тип оборудования"
                : "Редактировать тип оборудования"}
            </Typography>

            {serverError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {serverError}
              </Alert>
            )}

            <Box
              key={mode === "create" ? "create-equipment-type-form" : `edit-equipment-type-form-${editingEquipmentTypeId}`}
              component="form"
              onSubmit={form.handleSubmit(
                mode === "create" ? handleCreate : handleUpdate
              )}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              <Controller
                name="type_name"
                control={form.control}
                render={({ field }) => (
                  <TextField
                    label="Название типа оборудования"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={!!form.formState.errors.type_name}
                    helperText={form.formState.errors.type_name?.message}
                  />
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
                    label="Активен"
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
        </Grid>
      </Grid>
    </Box>
  );
}