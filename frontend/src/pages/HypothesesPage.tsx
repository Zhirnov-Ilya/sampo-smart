import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import { useDowntimes } from "../features/downtimes/useDowntimes";
import {
  useDeleteHypothesis,
  useGenerateHypothesis,
  useHypotheses,
} from "../features/hypotheses/useHypotheses";
import { PageLoader } from "../components/PageLoader";
import { SectionHeader } from "../components/SectionHeader";
import { EmptyState } from "../components/EmptyState";
import {
  formatDateTime,
  formatMoney,
  getPriorityLabel,
  getStatusLabel,
} from "../utils/format";
import { useAdminEquipment } from "../features/admin-equipment/useAdminEquipment";


function getStatusColor(
  status: string
): "default" | "success" | "error" | "warning" | "info" {
  switch (status) {
    case "accepted":
      return "success";
    case "rejected":
      return "error";
    case "in_progress":
      return "warning";
    case "done":
      return "info";
    default:
      return "default";
  }
}

function getPriorityColor(
  priorityScore: number | null
): "default" | "success" | "warning" | "error" {
  if (priorityScore == null) return "default";
  if (priorityScore >= 8) return "error";
  if (priorityScore >= 5) return "warning";
  return "success";
}

type DateSortOrder = "newest" | "oldest";
type PriorityFilter = "" | "high" | "medium" | "low";

export function HypothesesPage() {
  const navigate = useNavigate();

  const [selectedDowntimeId, setSelectedDowntimeId] = useState("");

  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("");
  const [selectedFilterDowntimeId, setSelectedFilterDowntimeId] = useState("");
  const [dateSortOrder, setDateSortOrder] = useState<DateSortOrder>("newest");

  const [serverError, setServerError] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hypothesisToDeleteId, setHypothesisToDeleteId] = useState<number | null>(null);
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
      data: hypotheses,
      isLoading,
      isError,
      isFetching,
    } = useHypotheses({
      search: debouncedSearchValue,
      status: statusFilter,
      priority: priorityFilter,
      downtime_id: selectedFilterDowntimeId,
      sort_order: dateSortOrder,
    });

  const { data: downtimes } = useDowntimes({
    sort_order: "newest",
  });

  const { data: equipmentList } = useAdminEquipment({
    sort_order: "newest",
  });

  const generateHypothesisMutation = useGenerateHypothesis();
  const deleteHypothesisMutation = useDeleteHypothesis();

  const handleGenerate = async () => {
    if (!selectedDowntimeId) {
      setServerError("Выберите простой для генерации гипотезы");
      return;
    }

    try {
      setServerError("");
      await generateHypothesisMutation.mutateAsync(Number(selectedDowntimeId));
      setSelectedDowntimeId("");
    } catch (error: any) {
      setServerError(
        error?.response?.data?.detail || "Не удалось сгенерировать гипотезу"
      );
    }
  };

  const handleDelete = (hypothesisId: number) => {
    setHypothesisToDeleteId(hypothesisId);
    setDeleteError("");
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (deleteHypothesisMutation.isPending) return;

    setDeleteDialogOpen(false);
    setHypothesisToDeleteId(null);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (hypothesisToDeleteId === null) return;

    try {
      setDeleteError("");
      setServerError("");

      await deleteHypothesisMutation.mutateAsync(hypothesisToDeleteId);

      setDeleteDialogOpen(false);
      setHypothesisToDeleteId(null);
    } catch (error: any) {
      setDeleteError(
        error?.response?.data?.detail || "Не удалось удалить гипотезу"
      );
    }
  };

  const hasActiveFilters =
    searchValue.trim() !== "" ||
    statusFilter !== "" ||
    priorityFilter !== "" ||
    selectedFilterDowntimeId !== "" ||
    dateSortOrder !== "newest";

  const handleResetFilters = () => {
    setSearchValue("");
    setDebouncedSearchValue("");
    setStatusFilter("");
    setPriorityFilter("");
    setSelectedFilterDowntimeId("");
    setDateSortOrder("newest");
  };

  const getEquipmentLabel = (equipmentId: number) => {
    const equipment = equipmentList?.find((item) => item.id === equipmentId);

    if (!equipment) {
      return `Оборудование ID ${equipmentId}`;
    }

    return `${equipment.name} (${equipment.equipment_code})`;
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !hypotheses) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Hypotheses
        </Typography>
        <Typography variant="body1">
          Не удалось загрузить список гипотез.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <SectionHeader
        title="Гипотезы"
        subtitle="Генерация и управление гипотезами на основе данных о простоях"
      />

      <Grid container spacing={3}>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
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
                Список гипотез
              </Typography>

              <Chip
                label={`Найдено: ${hypotheses.length}`}
                size="small"
                variant="outlined"
                sx={{
                  backgroundColor: "background.paper",
                  fontWeight: 500,
                }}
              />
            </Box>

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
                  Используй параметры ниже, чтобы быстрее найти нужную гипотезу.
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Поиск по названию, проблеме или рекомендации"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Статус"
                    select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="">Все статусы</MenuItem>
                    <MenuItem value="new">Новая</MenuItem>
                    <MenuItem value="accepted">Принята</MenuItem>
                    <MenuItem value="rejected">Отклонена</MenuItem>
                    <MenuItem value="in_progress">В работе</MenuItem>
                    <MenuItem value="done">Завершена</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Приоритет"
                    select
                    value={priorityFilter}
                    onChange={(e) =>
                      setPriorityFilter(e.target.value as PriorityFilter)
                    }
                    fullWidth
                  >
                    <MenuItem value="">Все приоритеты</MenuItem>
                    <MenuItem value="high">Высокий</MenuItem>
                    <MenuItem value="medium">Средний</MenuItem>
                    <MenuItem value="low">Низкий</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Простой"
                    select
                    value={selectedFilterDowntimeId}
                    onChange={(e) => setSelectedFilterDowntimeId(e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="">Все простои</MenuItem>
                    {downtimes?.map((item) => (
                      <MenuItem key={item.id} value={String(item.id)}>
                        Простой #{item.id} • {getEquipmentLabel(item.equipment_id)}
                      </MenuItem>
                    ))}
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

            {hypotheses.length === 0 ? (
              <EmptyState
                title={
                  hasActiveFilters
                    ? "Гипотезы не найдены"
                    : "Гипотезы пока отсутствуют"
                }
                description={
                  hasActiveFilters
                    ? "Попробуй изменить параметры поиска или сбросить фильтры."
                    : "Сгенерируй первую гипотезу на основе простоя оборудования."
                }
              />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {hypotheses.map((item) => (
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
                          {item.title}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Гипотеза №{item.id} - Простой №{item.downtime_id}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Chip
                          label={getStatusLabel(item.status)}
                          color={getStatusColor(item.status)}
                          size="small"
                        />

                        <Chip
                          label={getPriorityLabel(item.priority_score)}
                          color={getPriorityColor(item.priority_score)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {item.problem_description}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        mb: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        <Box
                          component="span"
                          sx={{ fontWeight: 600, color: "text.primary" }}
                        >
                          Экономия:
                        </Box>{" "}
                        {formatMoney(item.expected_cost_savings_rub)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        <Box
                          component="span"
                          sx={{ fontWeight: 600, color: "text.primary" }}
                        >
                          Снижение простоя:
                        </Box>{" "}
                        {item.expected_downtime_reduction_hours != null
                          ? `${item.expected_downtime_reduction_hours} ч.`
                          : "—"}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        Создано: {formatDateTime(item.created_at)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate(`/hypotheses/${item.id}`)}
                        sx={{ minWidth: 120 }}
                      >
                        Открыть
                      </Button>

                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteHypothesisMutation.isPending}
                        sx={{ minWidth: 120 }}
                      >
                        Удалить
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

         <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
              position: { lg: "sticky" },
              top: 88,
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Typography variant="h3" gutterBottom>
                Генерация гипотезы
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Выбери простой оборудования, чтобы сформировать гипотезу через AI.
              </Typography>
            </Box>

            {serverError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {serverError}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                select
                label="Простой для анализа"
                value={selectedDowntimeId}
                onChange={(e) => setSelectedDowntimeId(e.target.value)}
                fullWidth
              >
                <MenuItem value="">Выберите простой</MenuItem>
                {downtimes?.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>
                    Простой №{item.id} - {getEquipmentLabel(item.equipment_id)} - {" "}
                    {item.duration_minutes} мин.
                  </MenuItem>
                ))}
              </TextField>

              <Button
                variant="contained"
                color="primary"
                onClick={handleGenerate}
                disabled={generateHypothesisMutation.isPending}
                fullWidth
              >
                {generateHypothesisMutation.isPending
                  ? "Генерация..."
                  : "Сгенерировать гипотезу"}
              </Button>
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
          Удалить гипотезу?
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Вы действительно хотите удалить эту гипотезу?
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Это действие нельзя отменить. Гипотеза будет удалена из базы данных.
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
            disabled={deleteHypothesisMutation.isPending}
            sx={{ flex: 1, minWidth: 120 }}
          >
            Отмена
          </Button>

          <Button
            type="button"
            variant="outlined"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteHypothesisMutation.isPending}
            sx={{ flex: 1, minWidth: 120 }}
          >
            {deleteHypothesisMutation.isPending ? "Удаление..." : "Удалить"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}