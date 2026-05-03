import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";

import { useDowntimes } from "../features/downtimes/useDowntimes";
import { useGenerateHypothesis, useHypotheses } from "../features/hypotheses/useHypotheses";
import { PageLoader } from "../components/PageLoader";
import { SectionHeader } from "../components/SectionHeader";
import { EmptyState } from "../components/EmptyState";
import { getPriorityLabel, getStatusLabel } from "../utils/format";


function getStatusColor(status: string) {
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

function matchesPriority(
  priorityFilter: string,
  priorityScore: number | null
): boolean {
  if (priorityFilter === "all") return true;
  if (priorityScore == null) return false;

  if (priorityFilter === "high") return priorityScore >= 8;
  if (priorityFilter === "medium") return priorityScore >= 5 && priorityScore < 8;
  if (priorityFilter === "low") return priorityScore < 5;

  return true;
}

export function HypothesesPage() {
  const navigate = useNavigate();

  const { data: hypotheses, isLoading, isError } = useHypotheses();
  const { data: downtimes } = useDowntimes();
  const generateHypothesisMutation = useGenerateHypothesis();

  const [selectedDowntimeId, setSelectedDowntimeId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [serverError, setServerError] = useState("");

  const filteredHypotheses = useMemo(() => {
    if (!hypotheses) return [];

    const normalizedSearch = search.trim().toLowerCase();

    return hypotheses.filter((item) => {
      const matchesSearch =
        normalizedSearch === "" ||
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.problem_description.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      const matchesPriorityFilter = matchesPriority(
        priorityFilter,
        item.priority_score
      );

      return matchesSearch && matchesStatus && matchesPriorityFilter;
    });
  }, [hypotheses, search, statusFilter, priorityFilter]);

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
        subtitle="Поиск, фильтрация и генерация гипотез по зарегистрированным простоям"
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h3" gutterBottom>
              Генерация гипотезы
            </Typography>

            {serverError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {serverError}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Простой"
                select
                value={selectedDowntimeId}
                onChange={(e) => setSelectedDowntimeId(e.target.value)}
              >
                <MenuItem value="">Выберите простой</MenuItem>
                {downtimes?.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>
                    Простой #{item.id} • Equipment ID {item.equipment_id}
                  </MenuItem>
                ))}
              </TextField>

              <Button
                variant="contained"
                color="primary"
                onClick={handleGenerate}
                disabled={generateHypothesisMutation.isPending}
              >
                {generateHypothesisMutation.isPending
                  ? "Генерация..."
                  : "Сгенерировать гипотезу"}
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }}>
            <Typography variant="h3" gutterBottom>
              Фильтры
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Поиск"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Название или описание"
              />

              <TextField
                label="Статус"
                select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value="new">Новая</MenuItem>
                <MenuItem value="accepted">Принята</MenuItem>
                <MenuItem value="rejected">Отклонена</MenuItem>
                <MenuItem value="in_progress">В работе</MenuItem>
                <MenuItem value="done">Завершена</MenuItem>
              </TextField>

              <TextField
                label="Приоритет"
                select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value="high">Высокий</MenuItem>
                <MenuItem value="medium">Средний</MenuItem>
                <MenuItem value="low">Низкий</MenuItem>
              </TextField>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h3" gutterBottom>
              Список гипотез
            </Typography>

            {filteredHypotheses.length === 0 ? (
              <EmptyState
                title="Гипотезы не найдены"
                description="Измени параметры фильтрации или сгенерируй новую гипотезу."
              />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {filteredHypotheses.map((item) => (
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
                          {item.title}
                        </Typography>

                        <Typography variant="body2">
                          Hypothesis ID: {item.id} • Downtime ID: {item.downtime_id}
                        </Typography>
                      </Box>

                      <Chip
                        label={getStatusLabel(item.status)}
                        color={getStatusColor(item.status)}
                        size="small"
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.problem_description}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography variant="body2">
                        Приоритет: {getPriorityLabel(item.priority_score)}
                      </Typography>

                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate(`/hypotheses/${item.id}`)}
                      >
                        Открыть
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}