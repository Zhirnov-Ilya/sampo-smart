import { Box, CircularProgress } from "@mui/material";


export function PageLoader() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
      }}
    >
      <CircularProgress />
    </Box>
  );
}