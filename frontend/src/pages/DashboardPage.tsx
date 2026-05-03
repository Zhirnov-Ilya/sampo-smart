import { Box, Grid, Paper, Typography } from "@mui/material";

import { useMe } from "../features/auth/useMe";
import { useAnalyticsSummary } from "../features/dashboard/useAnalyticsSummary";
import { PageLoader } from "../components/PageLoader";
import { InfoCard } from "../components/InfoCard";
import { SectionHeader } from "../components/SectionHeader";
import { formatMoney } from "../utils/format";


export function DashboardPage() {
  const { data: user } = useMe();
  const { data, isLoading, isError } = useAnalyticsSummary();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !data) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Dashboard
        </Typography>

        <Typography variant="body1">
          Не удалось загрузить аналитику.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <SectionHeader
        title="Главная"
        subtitle={
          user
            ? `Добро пожаловать, ${user.full_name}. Ниже представлена сводная аналитика по системе.`
            : "Сводная аналитика по системе."
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <InfoCard
            label="Количество оборудования"
            value={data.equipment_count}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <InfoCard
            label="Количество простоев"
            value={data.downtime_count}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <InfoCard
            label="Количество гипотез"
            value={data.hypothesis_count}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <InfoCard
            label="Принятые гипотезы"
            value={data.accepted_hypothesis_count}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 8 }}>
          <InfoCard
            label="Суммарный ущерб"
            value={formatMoney(data.total_cost_impact_rub)}
          />
        </Grid>
      </Grid>
    </Box>
  );
}