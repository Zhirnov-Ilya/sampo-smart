import { Box, Button, Chip, Grid, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { useMe } from "../features/auth/useMe";
import { useAnalyticsSummary } from "../features/dashboard/useAnalyticsSummary";
import { PageLoader } from "../components/PageLoader";
import { formatMoney, getUserRoleLabel } from "../utils/format";
import { isManagerOrAnalyst } from "../utils/roles";

type MetricCardProps = {
  title: string;
  value: string | number;
  description: string;
};

function MetricCard({ title, value, description }: MetricCardProps) {
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
        height: "100%",
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {title}
      </Typography>

      <Typography variant="h2" sx={{ fontWeight: 700, mb: 0.5 }}>
        {value}
      </Typography>

      <Typography variant="caption" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  );
}

type SummaryRowProps = {
  label: string;
  value: string | number;
};

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        gap: 2,
        py: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": {
          borderBottom: "none",
        },
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>

      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();

  const { data: user } = useMe();
  const { data, isLoading, isError } = useAnalyticsSummary();
  const showLimitedQuickActions = isManagerOrAnalyst(user?.role);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !data) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Главная
        </Typography>

        <Typography variant="body1">
          Не удалось загрузить аналитику.
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
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h2" component="h1" gutterBottom>
            Главная
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Добро пожаловать, {user?.full_name ?? "пользователь"}. Ниже
            представлена сводная аналитика по оборудованию, простоям и
            AI-гипотезам.
          </Typography>
        </Box>

        {user?.role && (
          <Chip
            label={getUserRoleLabel(user.role)}
            variant="outlined"
            sx={{
              backgroundColor: "background.paper",
              fontWeight: 500,
            }}
          />
        )}
      </Box>

      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "#F4F6F8",
        }}
      >
        <Typography variant="h3" gutterBottom>
          Состояние системы
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Краткая сводка по ключевым сущностям платформы.
        </Typography>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard
            title="Оборудование"
            value={data.equipment_count}
            description="Всего единиц оборудования в системе"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard
            title="Простои"
            value={data.downtime_count}
            description="Зафиксированные события простоев"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard
            title="Гипотезы"
            value={data.hypothesis_count}
            description="Сгенерированные AI-гипотезы"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <MetricCard
            title="Принятые гипотезы"
            value={data.accepted_hypothesis_count}
            description="Гипотезы, принятые к реализации"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <MetricCard
            title="Суммарный ущерб"
            value={formatMoney(data.total_cost_impact_rub)}
            description="Финансовый эффект зафиксированных простоев"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
              height: "100%",
            }}
          >
            <Typography variant="h3" gutterBottom>
              Быстрые действия
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Основные сценарии работы с системой.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {!showLimitedQuickActions && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate("/admin/equipment")}
                >
                  Перейти к оборудованию
                </Button>
              )}

              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate("/downtimes")}
              >
                Зарегистрировать простой
              </Button>

              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate("/hypotheses")}
              >
                Сгенерировать гипотезу
              </Button>

              {!showLimitedQuickActions && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate("/admin/users")}
                >
                  Управление пользователями
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
              height: "100%",
            }}
          >
            <Typography variant="h3" gutterBottom>
              Краткая сводка
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Основные показатели платформы на текущий момент.
            </Typography>

            <SummaryRow
              label="Количество оборудования"
              value={data.equipment_count}
            />

            <SummaryRow
              label="Количество простоев"
              value={data.downtime_count}
            />

            <SummaryRow
              label="Количество гипотез"
              value={data.hypothesis_count}
            />

            <SummaryRow
              label="Принятые гипотезы"
              value={data.accepted_hypothesis_count}
            />

            <SummaryRow
              label="Суммарный ущерб"
              value={formatMoney(data.total_cost_impact_rub)}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}