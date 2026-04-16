import { Box, Container, Paper, Typography } from "@mui/material";


export function DashboardPage() {
  return (
    <Box sx={{ minHeight: "100vh", py: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>

        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="body1">
            Здесь будет аналитика и основные метрики системы.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}