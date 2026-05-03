import { Paper, Typography } from "@mui/material";

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Paper
      sx={{
        p: 4,
        borderRadius: 2,
        textAlign: "center",
        backgroundColor: "#FAFBFC",
      }}
    >
      <Typography variant="h3" gutterBottom>
        {title}
      </Typography>

      {description && (
        <Typography variant="body2">
          {description}
        </Typography>
      )}
    </Paper>
  );
}