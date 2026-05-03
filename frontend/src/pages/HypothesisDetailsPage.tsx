import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Divider,
} from "@mui/material";

import {
  useHypothesisById,
  useUpdateHypothesisStatus,
} from "../features/hypotheses/useHypotheses";
import { PageLoader } from "../components/PageLoader";


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

function getPriorityLabel(priorityScore: number | null) {
  if (priorityScore == null) return "—";
  if (priorityScore >= 8) return "Высокий";
  if (priorityScore >= 5) return "Средний";
  return "Низкий";
}

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return value.toLocaleString("ru-RU");
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );
}

function DetailList({
  label,
  items,
}: {
  label: string;
  items: string[] | null;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {label}
      </Typography>

      {!items || items.length === 0 ? (
        <Typography variant="body1">—</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {items.map((item, index) => (
            <Paper
              key={`${label}-${index}`}
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "#FAFBFC",
              }}
            >
              <Typography variant="body1">{item}</Typography>
            </Paper>
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
  const { data: hypothesis, isLoading, isError } =
    useHypothesisById(hypothesisId);
  const updateStatusMutation = useUpdateHypothesisStatus();

  const handleStatusChange = async (status: string) => {
    if (!hypothesis) return;

    await updateStatusMutation.mutateAsync({
      hypothesisId: hypothesis.id,
      status,
    });
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !hypothesis) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Hypothesis details
        </Typography>
        <Typography variant="body1">
          Не удалось загрузить гипотезу.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate("/hypotheses")}
            sx={{ mb: 2 }}
          >
            Назад к списку
          </Button>

          <Typography variant="h2" component="h1" gutterBottom>
            {hypothesis.title}
          </Typography>

          <Typography variant="body2">
            Hypothesis ID: {hypothesis.id} • Downtime ID: {hypothesis.downtime_id}
          </Typography>
        </Box>

        <Chip
          label={hypothesis.status}
          color={getStatusColor(hypothesis.status)}
          size="small"
        />
      </Box>

      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h3" gutterBottom>
          Управление статусом
        </Typography>

        <TextField
          label="Статус гипотезы"
          select
          size="small"
          value={hypothesis.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          sx={{ maxWidth: 260 }}
          disabled={updateStatusMutation.isPending}
        >
          <MenuItem value="new">new</MenuItem>
          <MenuItem value="accepted">accepted</MenuItem>
          <MenuItem value="rejected">rejected</MenuItem>
          <MenuItem value="in_progress">in_progress</MenuItem>
          <MenuItem value="done">done</MenuItem>
        </TextField>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h3" gutterBottom>
          Детальная информация
        </Typography>

        <DetailRow
          label="Приоритет"
          value={getPriorityLabel(hypothesis.priority_score)}
        />

        <DetailRow
          label="Описание проблемы"
          value={hypothesis.problem_description}
        />

        <DetailRow
          label="Корневая причина"
          value={hypothesis.root_cause || "—"}
        />

        <DetailRow
          label="Рекомендуемое действие"
          value={hypothesis.suggested_action}
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h3" gutterBottom>
          Ожидаемый эффект
        </Typography>

        <DetailRow
          label="Снижение простоя, часы"
          value={hypothesis.expected_downtime_reduction_hours ?? "—"}
        />

        <DetailRow
          label="Ожидаемая экономия, ₽"
          value={formatMoney(hypothesis.expected_cost_savings_rub)}
        />

        <DetailRow
          label="Стоимость внедрения, ₽"
          value={formatMoney(hypothesis.implementation_cost_rub)}
        />

        <DetailRow
          label="Срок внедрения, дни"
          value={hypothesis.implementation_time_days ?? "—"}
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h3" gutterBottom>
          Дополнительные сведения
        </Typography>

        <DetailList label="Риски" items={hypothesis.risks} />
        <DetailList label="Источники данных" items={hypothesis.data_sources} />
        <DetailList label="Похожие кейсы" items={hypothesis.similar_cases} />
      </Paper>
    </Box>
  );
}