import { Box, Typography } from "@mui/material";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function SectionHeader({
  title,
  subtitle,
  action,
}: SectionHeaderProps) {
  return (
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
        <Typography variant="h2" component="h1" gutterBottom>
          {title}
        </Typography>

        {subtitle && (
          <Typography variant="body2">
            {subtitle}
          </Typography>
        )}
      </Box>

      {action && <Box>{action}</Box>}
    </Box>
  );
}