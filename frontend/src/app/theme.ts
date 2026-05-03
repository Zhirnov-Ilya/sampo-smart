import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3E5C76",
      light: "#5680A3",
      dark: "#1E2F3F",
      contrastText: "#FFFFFF",
    },
    success: {
      main: "#4A7C59",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#C07F2A",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#A04545",
      contrastText: "#FFFFFF",
    },
    info: {
      main: "#3E5C76",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F5F7F9",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#2C3E50",
      secondary: "#5A6C7D",
      disabled: "#95A5B3",
    },
    divider: "#D0D5D9",
    grey: {
      50: "#FAFBFC",
      100: "#F5F7F9",
      200: "#E8EBED",
      300: "#D0D5D9",
      400: "#95A5B3",
      500: "#5A6C7D",
      700: "#2C3E50",
    },
  },
  typography: {
    fontFamily: "Inter, Roboto, Arial, sans-serif",
    h1: {
      fontSize: "32px",
      fontWeight: 700,
      lineHeight: 1.2,
      color: "#2C3E50",
    },
    h2: {
      fontSize: "24px",
      fontWeight: 600,
      lineHeight: 1.25,
      color: "#2C3E50",
    },
    h3: {
      fontSize: "18px",
      fontWeight: 600,
      lineHeight: 1.3,
      color: "#2C3E50",
    },
    h4: {
      fontSize: "18px",
      fontWeight: 600,
      lineHeight: 1.3,
      color: "#2C3E50",
    },
    body1: {
      fontSize: "15px",
      fontWeight: 400,
      lineHeight: 1.5,
      color: "#2C3E50",
    },
    body2: {
      fontSize: "13px",
      fontWeight: 400,
      lineHeight: 1.45,
      color: "#5A6C7D",
    },
    caption: {
      fontSize: "12px",
      fontWeight: 400,
      lineHeight: 1.4,
      color: "#95A5B3",
    },
    button: {
      fontSize: "14px",
      fontWeight: 600,
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F5F7F9",
          color: "#2C3E50",
        },
        "*": {
          boxSizing: "border-box",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: 6,
          boxShadow: "none",
          paddingLeft: 16,
          paddingRight: 16,
          textTransform: "none",
        },
        contained: {
          "&:hover": {
            boxShadow: "none",
          },
        },
        outlined: {
          "&:hover": {
            backgroundColor: "#F0F3F5",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid #E8EBED",
          boxShadow: "0 2px 4px rgba(44, 62, 80, 0.08)",
        },
        rounded: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #E8EBED",
          boxShadow: "0 2px 4px rgba(44, 62, 80, 0.08)",
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          borderRadius: 8,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#D0D5D9",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#5680A3",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#3E5C76",
            borderWidth: 1,
          },
        },
        input: {
          fontSize: "15px",
          color: "#2C3E50",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#5A6C7D",
          "&.Mui-focused": {
            color: "#3E5C76",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "#F5F7F9",
          color: "#2C3E50",
          fontWeight: 700,
          borderBottom: "1px solid #E8EBED",
        },
        body: {
          color: "#2C3E50",
          borderBottom: "1px solid #E8EBED",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontSize: "12px",
          fontWeight: 500,
        },
      },
    },
  },
});