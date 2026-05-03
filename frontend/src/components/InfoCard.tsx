import { Paper, Typography } from "@mui/material";

type InfoCardProps = {
  label: string;
  value: string | number;
};

export function InfoCard({ label, value }: InfoCardProps) {
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        height: "100%",
      }}
    >
      <Typography variant="body2" sx={{ mb: 1 }}>
        {label}
      </Typography>

      <Typography variant="h2" component="p">
        {value}
      </Typography>
    </Paper>
  );
}