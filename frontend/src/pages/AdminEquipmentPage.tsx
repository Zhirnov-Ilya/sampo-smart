import {  useState, useEffect } from "react";
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
type DateSortOrder = "newest" | "oldest";
type ActiveFilter = "" | "true" | "false";

export function AdminEquipmentPage() {
  const { data: enterprises } = useAdminEnterprises();
  const { data: equipmentTypes } = useAdminEquipmentTypes();

  const { data: activeEnterprises } = useAdminEnterprises({
    is_active: "true",
    sort_order: "newest",
  });

const { data: activeEquipmentTypes } = useAdminEquipmentTypes({
    is_active: "true",
    sort_order: "newest",
  });

  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState("");
  const [selectedEquipmentTypeId, setSelectedEquipmentTypeId] = useState("");
  const [dateSortOrder, setDateSortOrder] = useState<DateSortOrder>("newest");
  const [selectedActiveStatus, setSelectedActiveStatus] = useState<ActiveFilter>("");
  
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchValue(searchValue.trim());
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchValue]);

  const {
    data: equipment,
    isLoading,
    isError,
    isFetching,
  } = useAdminEquipment({
    search: debouncedSearchValue,
    enterprise_id: selectedEnterpriseId,
    equipment_type_id: selectedEquipmentTypeId,
    is_active: selectedActiveStatus,
    sort_order: dateSortOrder,
  });

  const createMutation = useCreateAdminEquipment();
  const updateMutation = useUpdateAdminEquipment();
  const activateMutation = useActivateAdminEquipment();
  const deactivateMutation = useDeactivateAdminEquipment();

  const [serverError, setServerError] = useState("");
  const [mode, setMode] = useState<EditMode>("create");
  const [editingEquipmentId, setEditingEquipmentId] = useState<number | null>(null);

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

const hasActiveFilters =
    searchValue.trim() !== "" ||
    selectedEnterpriseId !== "" ||
    selectedEquipmentTypeId !== "" ||
    selectedActiveStatus !== "" ||
    dateSortOrder !== "newest";

const handleResetFilters = () => {
    setSearchValue("");
    setDebouncedSearchValue("");
    setSelectedEnterpriseId("");
    setSelectedEquipmentTypeId("");
    setSelectedActiveStatus("");
    setDateSortOrder("newest");
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
    <Box>
      <SectionHeader
        title="Оборудование"
        subtitle="Управление оборудованием предприятий"
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
                    Используй параметры ниже, чтобы быстрее найти нужное оборудование.
                    </Typography>
                </Box>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                    <TextField
                        label="Поиск по названию"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        fullWidth
                    />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        label="Предприятие"
                        select
                        value={selectedEnterpriseId}
                        onChange={(e) => setSelectedEnterpriseId(e.target.value)}
                        fullWidth
                      >
                        <MenuItem value="">Все предприятия</MenuItem>
                        {enterprises?.map((enterprise) => (
                          <MenuItem key={enterprise.id} value={String(enterprise.id)}>
                            {enterprise.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        label="Тип оборудования"
                        select
                        value={selectedEquipmentTypeId}
                        onChange={(e) => setSelectedEquipmentTypeId(e.target.value)}
                        fullWidth
                      >
                        <MenuItem value="">Все типы</MenuItem>
                        {equipmentTypes?.map((equipmentType) => (
                          <MenuItem key={equipmentType.id} value={String(equipmentType.id)}>
                            {equipmentType.type_name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        label="Статус"
                        select
                        value={selectedActiveStatus}
                        onChange={(e) =>
                          setSelectedActiveStatus(e.target.value as ActiveFilter)
                        }
                        fullWidth
                      >
                        <MenuItem value="">Все оборудование</MenuItem>
                        <MenuItem value="true">Только активное</MenuItem>
                        <MenuItem value="false">Только неактивное</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        label="Сортировка по дате"
                        select
                        value={dateSortOrder}
                        onChange={(e) => setDateSortOrder(e.target.value as DateSortOrder)}
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
                    Список оборудования
                </Typography>

                <Chip
                    label={`Найдено: ${equipment.length}`}
                    size="small"
                    variant="outlined"
                    sx={{
                    backgroundColor: "background.paper",
                    fontWeight: 500,
                    }}
                />
            </Box>

            {equipment.length === 0 ? (
            <EmptyState
                title={
                hasActiveFilters
                    ? "Оборудование не найдено"
                    : "Оборудование пока отсутствует"
                }
                description={
                hasActiveFilters
                    ? "Попробуй изменить параметры поиска или сбросить фильтры."
                    : "Создай первую единицу оборудования через форму справа."
                }
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
                            {item.name}
                          </Typography>

                          <Typography variant="body2" color="text.secondary">
                            Код: {item.equipment_code}
                          </Typography>
                        </Box>

                        <Chip
                          label={item.is_active ? "Активно" : "Неактивно"}
                          color={item.is_active ? "success" : "default"}
                          size="small"
                        />
                      </Box>

                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                            Предприятие:
                            </Box>{" "}
                            {enterpriseName}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                            Тип:
                            </Box>{" "}
                            {equipmentTypeName}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                            Локация:
                            </Box>{" "}
                            {item.location || "—"}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                            Создано: {formatDateTime(item.created_at)}
                        </Typography>
                    </Box>

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
          <Box  sx={{
            position: { lg: "sticky" },
            top: 88,
            }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="h3" gutterBottom>
                  {mode === "create"
                    ? "Добавить оборудование"
                    : "Редактировать оборудование"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {mode === "create"
                    ? "Заполни данные новой единицы оборудования и выбери предприятие."
                    : "Измени данные оборудования и сохрани изменения."}
                </Typography>
              </Box>

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
                      {activeEnterprises?.map((enterprise) => (
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
                      {activeEquipmentTypes?.map((equipmentType) => (
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

                <Box sx={{ display: "flex", gap: 1.5, flexDirection: { xs: "column", sm: "row" }, mt: 1, }}>
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
                        px: 3,
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
                            minWidth: 100,
                            flex: 1,
                        }}
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