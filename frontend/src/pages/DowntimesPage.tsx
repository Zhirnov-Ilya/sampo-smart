import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAdminEquipment } from "../features/admin-equipment/useAdminEquipment";
import { useMe } from "../features/auth/useMe";
import {
  useCreateDowntime,
  useDeleteDowntime,
  useDowntimes,
  useUpdateDowntime,
} from "../features/downtimes/useDowntimes";
import { downtimeSchema } from "../features/downtimes/downtime.schema";
import type { DowntimeFormValues } from "../features/downtimes/downtime.schema";

import { PageLoader } from "../components/PageLoader";
import { SectionHeader } from "../components/SectionHeader";
import { EmptyState } from "../components/EmptyState";
import { formatDateTime, formatMoney } from "../utils/format";

type EditMode = "create" | "edit";
type DateSortOrder = "newest" | "oldest";

function toDateTimeLocalValue(value: string) {
  return value.slice(0, 16);
}

export function DowntimesPage() {
  const { data: user } = useMe();

  
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [reasonCategoryFilter, setReasonCategoryFilter] = useState("");
  const [startFrom, setStartFrom] = useState("");
  const [startTo, setStartTo] = useState("");
  const [dateSortOrder, setDateSortOrder] = useState<DateSortOrder>("newest");

  const [serverError, setServerError] = useState("");
  const [mode, setMode] = useState<EditMode>("create");
  const [editingDowntimeId, setEditingDowntimeId] = useState<number | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [downtimeToDeleteId, setDowntimeToDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchValue(searchValue.trim());
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchValue]);

  const {
    data: downtimes,
    isLoading,
    isError,
    isFetching,
  } = useDowntimes({
    search: debouncedSearchValue,
    equipment_id: selectedEquipmentId,
    reason_category: reasonCategoryFilter.trim(),
    start_from: startFrom,
    start_to: startTo,
    sort_order: dateSortOrder,
  });

  const { data: equipmentList } = useAdminEquipment({
    sort_order: "newest",
  });

  const { data: activeEquipmentList } = useAdminEquipment({
    is_active: "true",
    sort_order: "newest",
  });

  const createDowntimeMutation = useCreateDowntime();
  const updateDowntimeMutation = useUpdateDowntime();
  const deleteDowntimeMutation = useDeleteDowntime();

  const {
    control,
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

      const payload = {
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
      };

      if (mode === "create") {
        await createDowntimeMutation.mutateAsync(payload);
      } else {
        if (!editingDowntimeId) return;

        await updateDowntimeMutation.mutateAsync({
          downtimeId: editingDowntimeId,
          data: payload,
        });

        setMode("create");
        setEditingDowntimeId(null);
      }

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
      error?.response?.data?.detail ||
        (mode === "create"
          ? "Не удалось создать простой"
          : "Не удалось обновить простой")
    );
    }
  };

  const handleEdit = (item: {
    id: number;
    equipment_id: number;
    start_time: string;
    end_time: string;
    reason_category: string | null;
    reason_details: string | null;
    production_loss_units: number | null;
    cost_impact_rub: number | null;
    reported_by: string | null;
  }) => {
    setMode("edit");
    setEditingDowntimeId(item.id);
    setServerError("");

    reset({
      equipment_id: String(item.equipment_id),
      start_time: toDateTimeLocalValue(item.start_time),
      end_time: toDateTimeLocalValue(item.end_time),
      reason_category: item.reason_category || "",
      reason_details: item.reason_details || "",
      production_loss_units:
        item.production_loss_units !== null
          ? String(item.production_loss_units)
          : "",
      cost_impact_rub:
        item.cost_impact_rub !== null
          ? String(item.cost_impact_rub)
          : "",
      reported_by: item.reported_by || user?.full_name || "",
    });
  };

  const handleCancelEdit = () => {
    setMode("create");
    setEditingDowntimeId(null);
    setServerError("");

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
  };

  const handleDelete = (downtimeId: number) => {
    setDowntimeToDeleteId(downtimeId);
    setDeleteError("");
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (deleteDowntimeMutation.isPending) return;

    setDeleteDialogOpen(false);
    setDowntimeToDeleteId(null);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (downtimeToDeleteId === null) return;

    try {
      setDeleteError("");
      setServerError("");

      const deletingDowntimeId = downtimeToDeleteId;

      await deleteDowntimeMutation.mutateAsync(deletingDowntimeId);

      if (editingDowntimeId === deletingDowntimeId) {
        handleCancelEdit();
      }

      setDeleteDialogOpen(false);
      setDowntimeToDeleteId(null);
    } catch (error: any) {
      setDeleteError(
        error?.response?.data?.detail || "Не удалось удалить простой"
      );
    }
  };

  const hasActiveFilters =
    searchValue.trim() !== "" ||
    selectedEquipmentId !== "" ||
    reasonCategoryFilter.trim() !== "" ||
    startFrom !== "" ||
    startTo !== "" ||
    dateSortOrder !== "newest";

  const handleResetFilters = () => {
    setSearchValue("");
    setDebouncedSearchValue("");
    setSelectedEquipmentId("");
    setReasonCategoryFilter("");
    setStartFrom("");
    setStartTo("");
    setDateSortOrder("newest");
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !downtimes) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Простои
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
                  Используй параметры ниже, чтобы быстрее найти нужный простой.
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Поиск по оборудованию, причине или автору"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Оборудование"
                    select
                    value={selectedEquipmentId}
                    onChange={(e) => setSelectedEquipmentId(e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="">Все оборудование</MenuItem>
                    {equipmentList?.map((equipment) => (
                      <MenuItem key={equipment.id} value={String(equipment.id)}>
                        {equipment.name} ({equipment.equipment_code})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Категория причины"
                    value={reasonCategoryFilter}
                    onChange={(e) => setReasonCategoryFilter(e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Начало периода"
                    type="datetime-local"
                    value={startFrom}
                    onChange={(e) => setStartFrom(e.target.value)}
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Конец периода"
                    type="datetime-local"
                    value={startTo}
                    onChange={(e) => setStartTo(e.target.value)}
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
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
                Список простоев
              </Typography>

              <Chip
                label={`Найдено: ${downtimes.length}`}
                size="small"
                variant="outlined"
                sx={{
                  backgroundColor: "background.paper",
                  fontWeight: 500,
                }}
              />
            </Box>

            {downtimes.length === 0 ? (
              <EmptyState
                title={
                  hasActiveFilters
                    ? "Простои не найдены"
                    : "Простои пока отсутствуют"
                }
                description={
                  hasActiveFilters
                    ? "Попробуй изменить параметры поиска или сбросить фильтры."
                    : "Добавь первый простой через форму справа."
                }
              />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {downtimes.map((item) => {
                  
                  const equipment = equipmentList?.find(
                    (equipmentItem) => equipmentItem.id === item.equipment_id
                  );

                  const equipmentName = equipment?.name || `ID ${item.equipment_id}`;
                  const equipmentCode = equipment?.equipment_code;

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
                            Простой #{item.id}
                          </Typography>

                          <Typography variant="body2" color="text.secondary">
                            {equipmentName}
                            {equipmentCode ? ` (${equipmentCode})` : ""}
                          </Typography>
                        </Box>

                        <Chip
                          label={`${item.duration_minutes} мин.`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                            Начало:
                          </Box>{" "}
                          {formatDateTime(item.start_time)}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                            Окончание:
                          </Box>{" "}
                          {formatDateTime(item.end_time)}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                            Категория:
                          </Box>{" "}
                          {item.reason_category || "—"}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                            Ущерб:
                          </Box>{" "}
                          {formatMoney(item.cost_impact_rub)}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                            Ответственный:
                          </Box>{" "}
                          {item.reported_by || "—"}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => handleEdit(item)}
                          sx={{ minWidth: 140 }}
                        >
                          Редактировать
                        </Button>

                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteDowntimeMutation.isPending}
                          sx={{ minWidth: 120 }}
                        >
                          Удалить
                        </Button>
                      </Box>
                    </Paper>
                  );
                })}
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
                {mode === "create" ? "Добавить простой" : "Редактировать простой"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {mode === "create"
                  ? "Заполни данные о простое оборудования."
                  : "Измени данные простоя и сохрани изменения."}
              </Typography>
            </Box>

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
              
              <Controller
                name="equipment_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Оборудование"
                    select
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={!!errors.equipment_id}
                    helperText={errors.equipment_id?.message}
                    fullWidth
                  >
                    <MenuItem value="">Выберите оборудование</MenuItem>
                    {activeEquipmentList?.map((item) => (
                      <MenuItem key={item.id} value={String(item.id)}>
                        {item.name} ({item.equipment_code})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                name="start_time"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Начало простоя"
                    type="datetime-local"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={!!errors.start_time}
                    helperText={errors.start_time?.message}
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="end_time"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Окончание простоя"
                    type="datetime-local"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={!!errors.end_time}
                    helperText={errors.end_time?.message}
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="reason_category"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Категория причины"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={!!errors.reason_category}
                    helperText={errors.reason_category?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="reason_details"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Описание причины"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={!!errors.reason_details}
                    helperText={errors.reason_details?.message}
                    multiline
                    minRows={3}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="production_loss_units"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Потеря продукции"
                    type="number"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={!!errors.production_loss_units}
                    helperText={errors.production_loss_units?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="cost_impact_rub"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Финансовый ущерб, ₽"
                    type="number"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={!!errors.cost_impact_rub}
                    helperText={errors.cost_impact_rub?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="reported_by"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Ответственный"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={!!errors.reported_by}
                    helperText={errors.reported_by?.message}
                    fullWidth
                  />
                )}
              />

              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  flexDirection: { xs: "column", sm: "row" },
                  mt: 1,
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={
                    isSubmitting ||
                    createDowntimeMutation.isPending ||
                    updateDowntimeMutation.isPending
                  }
                  sx={{
                    flex: 1,
                    minWidth: 120,
                  }}
                >
                  {mode === "create"
                    ? createDowntimeMutation.isPending || isSubmitting
                      ? "Создание..."
                      : "Создать"
                    : updateDowntimeMutation.isPending || isSubmitting
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

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.18)",
            },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          Удалить простой?
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Вы действительно хотите удалить этот простой?
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Это действие нельзя отменить. Если по простою уже связаны гипотезы,
            система не позволит удалить запись.
          </Typography>

          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            gap: 1.5,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Button
            type="button"
            variant="outlined"
            color="primary"
            onClick={handleCloseDeleteDialog}
            disabled={deleteDowntimeMutation.isPending}
            sx={{ flex: 1, minWidth: 120 }}
          >
            Отмена
          </Button>

          <Button
            type="button"
            variant="outlined"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteDowntimeMutation.isPending}
            sx={{ flex: 1, minWidth: 120 }}
          >
            {deleteDowntimeMutation.isPending ? "Удаление..." : "Удалить"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}