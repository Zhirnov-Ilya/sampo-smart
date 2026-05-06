import { useState, useEffect } from "react";
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
  MenuItem,
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
type DateSortOrder = "newest" | "oldest";
type ActiveFilter = "" | "true" | "false";

export function AdminEquipmentTypesPage() {
  
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [selectedActiveStatus, setSelectedActiveStatus] = useState<ActiveFilter>("");
  const [dateSortOrder, setDateSortOrder] = useState<DateSortOrder>("newest");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchValue(searchValue.trim());
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchValue]);

  const {
    data: equipmentTypes,
    isLoading,
    isError,
    isFetching,
  } = useAdminEquipmentTypes({
    search: debouncedSearchValue,
    is_active: selectedActiveStatus,
    sort_order: dateSortOrder,
  });

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

  const hasActiveFilters =
    searchValue.trim() !== "" ||
    selectedActiveStatus !== "" ||
    dateSortOrder !== "newest";

  const handleResetFilters = () => {
    setSearchValue("");
    setDebouncedSearchValue("");
    setSelectedActiveStatus("");
    setDateSortOrder("newest");
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
            
            <Paper
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 2,
                backgroundColor: "#F4F6F8",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Фильтры и поиск
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Используй параметры ниже, чтобы быстрее найти нужный тип оборудования.
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Поиск по названию типа"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Статус"
                    select
                    value={selectedActiveStatus}
                    onChange={(e) =>
                      setSelectedActiveStatus(e.target.value as ActiveFilter)
                    }
                    fullWidth
                  >
                    <MenuItem value="">Все типы оборудования</MenuItem>
                    <MenuItem value="true">Только активные</MenuItem>
                    <MenuItem value="false">Только неактивные</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Сортировка по дате"
                    select
                    value={dateSortOrder}
                    onChange={(e) =>
                      setDateSortOrder(e.target.value as DateSortOrder)
                    }
                    fullWidth
                  >
                    <MenuItem value="newest">Сначала новые</MenuItem>
                    <MenuItem value="oldest">Сначала старые</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleResetFilters}
                      disabled={!hasActiveFilters}
                    >
                      Сбросить фильтры
                    </Button>

                    {isFetching && (
                      <Typography variant="caption" color="text.secondary">
                        Обновление списка...
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                mb: 2,
              }}
            >
              <Typography variant="h3">
                Список типов оборудования
              </Typography>

              <Chip
                label={`Найдено: ${equipmentTypes.length}`}
                size="small"
                variant="outlined"
                sx={{
                  backgroundColor: "background.paper",
                  fontWeight: 500,
                }}
              />
            </Box>

            {equipmentTypes.length === 0 ? (
              <EmptyState
                title={
                  hasActiveFilters
                    ? "Типы оборудования не найдены"
                    : "Типы оборудования пока отсутствуют"
                }
                description={
                  hasActiveFilters
                    ? "Попробуй изменить параметры поиска или сбросить фильтры."
                    : "Создай первый тип оборудования через форму справа."
                }
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
                      border: "1px solid",
                      borderColor: "divider",
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

                        <Typography variant="body2" color="text.secondary">
                          Equipment Type ID: {equipmentType.id}
                        </Typography>
                      </Box>

                      <Chip
                        label={equipmentType.is_active ? "Активен" : "Неактивен"}
                        color={equipmentType.is_active ? "success" : "default"}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Создано: {formatDateTime(equipmentType.created_at)}
                      </Typography>
                    </Box>

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
          <Paper sx={{
             p: 3, borderRadius: 2,
             boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
             position: { lg: "sticky" },
             top: 88, 
             }}>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="h3" gutterBottom>
                {mode === "create"
                  ? "Добавить тип оборудования"
                  : "Редактировать тип оборудования"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {mode === "create"
                  ? "Укажи название нового типа оборудования для справочника."
                  : "Измени название типа оборудования и сохрани изменения."}
              </Typography>
            </Box>

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

              <Box sx={{ 
                display: "flex", gap: 1.5, flexWrap: "wrap",
                flexDirection: { xs: "column", sm: "row" },
                mt: 1, }}
                >
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={
                    form.formState.isSubmitting ||
                    createMutation.isPending ||
                    updateMutation.isPending
                  }
                  sx={{
                    flex: 1,
                    minWidth: 120,
                  }}
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
                    sx={{
                      flex: 1,
                      minWidth: 120,
                    }}
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