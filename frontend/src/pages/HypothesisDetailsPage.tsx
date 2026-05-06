import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import {
  useHypothesisById,
  useUpdateHypothesisStatus,
} from "../features/hypotheses/useHypotheses";
import { PageLoader } from "../components/PageLoader";
import {
  formatDateTime,
  formatMoney,
  getPriorityLabel,
  getStatusLabel,
} from "../utils/format";

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
  priorityScore: number | null | undefined
): "default" | "success" | "warning" | "error" {
  if (priorityScore == null) return "default";
  if (priorityScore >= 8) return "error";
  if (priorityScore >= 5) return "warning";
  return "success";
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <Box>
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, mb: 0.5 }}
      >
        {label}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

function DetailList({
  label,
  items,
}: {
  label: string;
  items: string[] | null | undefined;
}) {
  return (
    <Box>
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, mb: 0.5 }}
      >
        {label}
      </Typography>

      {!items || items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          —
        </Typography>
      ) : (
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {items.map((item, index) => (
            <Typography
              key={`${item}-${index}`}
              component="li"
              variant="body2"
              color="text.secondary"
              sx={{ mb: 0.5 }}
            >
              {item}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}

export function HypothesisDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();

  const hypothesisId = Number(params.id);

  const {
    data: hypothesis,
    isLoading,
    isError,
  } = useHypothesisById(hypothesisId);

  const updateStatusMutation = useUpdateHypothesisStatus();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [hypothesisId]);

  const handleStatusChange = async (status: string) => {
    if (!hypothesis) return;

    await updateStatusMutation.mutateAsync({
      hypothesisId: hypothesis.id,
      status,
    });
  };

  function splitActionSteps(value: string | null | undefined): string[] {
    if (!value) return [];

    return value
      .split(/(?=\d+\.\s)/)
      .map((step) => step.trim())
      .filter(Boolean);
    }

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !hypothesis) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Детали гипотезы
        </Typography>

        <Typography variant="body1">
          Не удалось загрузить гипотезу.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => navigate("/hypotheses")}
        sx={{ mb: 3 }}
      >
        Назад к списку
      </Button>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 2,
                mb: 2,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h2" component="h1" gutterBottom>
                  {hypothesis.title}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Гипотеза №{hypothesis.id} — простой №{hypothesis.downtime_id}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={getStatusLabel(hypothesis.status)}
                  color={getStatusColor(hypothesis.status)}
                  size="small"
                />

                <Chip
                  label={getPriorityLabel(hypothesis.priority_score)}
                  color={getPriorityColor(hypothesis.priority_score)}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography variant="h3" gutterBottom>
                  Описание проблемы
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {hypothesis.problem_description}
                </Typography>
              </Box>

              <Box>
                <Typography variant="h3" gutterBottom>
                  Корневая причина
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {hypothesis.root_cause || "—"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="h3" gutterBottom>
                  Рекомендуемое действие
                </Typography>

                {splitActionSteps(hypothesis.suggested_action).length > 1 ? (
                <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
                  {splitActionSteps(hypothesis.suggested_action).map((step, index) => (
                    <Typography
                      key={`${step}-${index}`}
                      component="li"
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.75 }}
                    >
                      {step.replace(/^\d+\.\s*/, "")}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {hypothesis.suggested_action || "—"}
                </Typography>
              )}
              </Box>
            </Box>
          </Paper>

          <Paper
            sx={{
              p: 3,
              mt: 3,
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
            }}
          >
            <Typography variant="h3" gutterBottom>
              Ожидаемый эффект
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailRow
                  label="Снижение простоя"
                  value={
                    hypothesis.expected_downtime_reduction_hours != null
                      ? `${hypothesis.expected_downtime_reduction_hours} ч.`
                      : "—"
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <DetailRow
                  label="Ожидаемая экономия"
                  value={formatMoney(hypothesis.expected_cost_savings_rub)}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <DetailRow
                  label="Стоимость внедрения"
                  value={formatMoney(hypothesis.implementation_cost_rub)}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <DetailRow
                  label="Срок внедрения"
                  value={
                    hypothesis.implementation_time_days != null
                      ? `${hypothesis.implementation_time_days} дн.`
                      : "—"
                  }
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper
            sx={{
              p: 3,
              mt: 3,
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
            }}
          >
            <Typography variant="h3" gutterBottom>
              Дополнительные сведения
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailList
                  label="Риски"
                  items={hypothesis.risks}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <DetailList
                  label="Источники данных"
                  items={hypothesis.data_sources}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <DetailList
                  label="Похожие кейсы"
                  items={hypothesis.similar_cases}
                />
              </Grid>
            </Grid>
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
                Управление гипотезой
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Измени статус гипотезы после принятия управленческого решения.
              </Typography>
            </Box>

            <TextField
              select
              label="Статус"
              value={hypothesis.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updateStatusMutation.isPending}
              fullWidth
            >
              <MenuItem value="new">Новая</MenuItem>
              <MenuItem value="accepted">Принята</MenuItem>
              <MenuItem value="rejected">Отклонена</MenuItem>
              <MenuItem value="in_progress">В работе</MenuItem>
              <MenuItem value="done">Завершена</MenuItem>
            </TextField>

            {updateStatusMutation.isPending && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1.5 }}
              >
                Обновление статуса...
              </Typography>
            )}

            <Divider sx={{ my: 2.5 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <DetailRow
                label="Связанный простой"
                value={`Простой №${hypothesis.downtime_id}`}
              />

              <DetailRow
                label="Приоритетный балл"
                value={hypothesis.priority_score ?? "—"}
              />

              <DetailRow
                label="Дата создания"
                value={formatDateTime(hypothesis.created_at)}
              />

              <DetailRow
                label="Дата обновления"
                value={formatDateTime(hypothesis.updated_at)}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}