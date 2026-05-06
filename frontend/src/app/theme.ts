// import { createTheme } from "@mui/material/styles";

// export const theme = createTheme({
//   palette: {
//     mode: "light",
//     primary: {
//       main: "#3E5C76",
//       light: "#5680A3",
//       dark: "#1E2F3F",
//       contrastText: "#FFFFFF",
//     },
//     success: {
//       main: "#4A7C59",
//       contrastText: "#FFFFFF",
//     },
//     warning: {
//       main: "#C07F2A",
//       contrastText: "#FFFFFF",
//     },
//     error: {
//       main: "#A04545",
//       contrastText: "#FFFFFF",
//     },
//     info: {
//       main: "#3E5C76",
//       contrastText: "#FFFFFF",
//     },
//     background: {
//       default: "#F5F7F9",
//       paper: "#FFFFFF",
//     },
//     text: {
//       primary: "#2C3E50",
//       secondary: "#5A6C7D",
//       disabled: "#95A5B3",
//     },
//     divider: "#D0D5D9",
//     grey: {
//       50: "#FAFBFC",
//       100: "#F5F7F9",
//       200: "#E8EBED",
//       300: "#D0D5D9",
//       400: "#95A5B3",
//       500: "#5A6C7D",
//       700: "#2C3E50",
//     },
//   },
//   typography: {
//     fontFamily: "Inter, Roboto, Arial, sans-serif",
//     h1: {
//       fontSize: "32px",
//       fontWeight: 700,
//       lineHeight: 1.2,
//       color: "#2C3E50",
//     },
//     h2: {
//       fontSize: "24px",
//       fontWeight: 600,
//       lineHeight: 1.25,
//       color: "#2C3E50",
//     },
//     h3: {
//       fontSize: "18px",
//       fontWeight: 600,
//       lineHeight: 1.3,
//       color: "#2C3E50",
//     },
//     h4: {
//       fontSize: "18px",
//       fontWeight: 600,
//       lineHeight: 1.3,
//       color: "#2C3E50",
//     },
//     body1: {
//       fontSize: "15px",
//       fontWeight: 400,
//       lineHeight: 1.5,
//       color: "#2C3E50",
//     },
//     body2: {
//       fontSize: "13px",
//       fontWeight: 400,
//       lineHeight: 1.45,
//       color: "#5A6C7D",
//     },
//     caption: {
//       fontSize: "12px",
//       fontWeight: 400,
//       lineHeight: 1.4,
//       color: "#95A5B3",
//     },
//     button: {
//       fontSize: "14px",
//       fontWeight: 600,
//       textTransform: "none",
//     },
//   },
//   shape: {
//     borderRadius: 8,
//   },
//   components: {
//     MuiCssBaseline: {
//       styleOverrides: {
//         body: {
//           backgroundColor: "#F5F7F9",
//           color: "#2C3E50",
//         },
//         "*": {
//           boxSizing: "border-box",
//         },
//       },
//     },
//     MuiButton: {
//       styleOverrides: {
//         root: {
//           minHeight: 40,
//           borderRadius: 6,
//           boxShadow: "none",
//           paddingLeft: 16,
//           paddingRight: 16,
//           textTransform: "none",
//         },
//         contained: {
//           "&:hover": {
//             boxShadow: "none",
//           },
//         },
//         outlined: {
//           "&:hover": {
//             backgroundColor: "#F0F3F5",
//           },
//         },
//       },
//     },
//     MuiPaper: {
//       styleOverrides: {
//         root: {
//           backgroundImage: "none",
//           border: "1px solid #E8EBED",
//           boxShadow: "0 2px 4px rgba(44, 62, 80, 0.08)",
//         },
//         rounded: {
//           borderRadius: 8,
//         },
//       },
//     },
//     MuiCard: {
//       styleOverrides: {
//         root: {
//           border: "1px solid #E8EBED",
//           boxShadow: "0 2px 4px rgba(44, 62, 80, 0.08)",
//           borderRadius: 8,
//         },
//       },
//     },
//     MuiTextField: {
//       defaultProps: {
//         fullWidth: true,
//         variant: "outlined",
//       },
//     },
//     MuiOutlinedInput: {
//       styleOverrides: {
//         root: {
//           backgroundColor: "#FFFFFF",
//           borderRadius: 8,
//           "& .MuiOutlinedInput-notchedOutline": {
//             borderColor: "#D0D5D9",
//           },
//           "&:hover .MuiOutlinedInput-notchedOutline": {
//             borderColor: "#5680A3",
//           },
//           "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
//             borderColor: "#3E5C76",
//             borderWidth: 1,
//           },
//         },
//         input: {
//           fontSize: "15px",
//           color: "#2C3E50",
//         },
//       },
//     },
//     MuiInputLabel: {
//       styleOverrides: {
//         root: {
//           color: "#5A6C7D",
//           "&.Mui-focused": {
//             color: "#3E5C76",
//           },
//         },
//       },
//     },
//     MuiTableCell: {
//       styleOverrides: {
//         head: {
//           backgroundColor: "#F5F7F9",
//           color: "#2C3E50",
//           fontWeight: 700,
//           borderBottom: "1px solid #E8EBED",
//         },
//         body: {
//           color: "#2C3E50",
//           borderBottom: "1px solid #E8EBED",
//         },
//       },
//     },
//     MuiChip: {
//       styleOverrides: {
//         root: {
//           borderRadius: 12,
//           fontSize: "12px",
//           fontWeight: 500,
//         },
//       },
//     },
//   },
// });

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: "#3F6E8A",
      light: "#5A87A2",
      dark: "#2C5268",
      contrastText: "#FFFFFF",
    },

    success: {
      main: "#3F7D5A",
      light: "#E8F3ED",
      dark: "#2E5F43",
      contrastText: "#FFFFFF",
    },

    warning: {
      main: "#C07F2A",
      light: "#FFF4E4",
      dark: "#8A5A16",
      contrastText: "#FFFFFF",
    },

    error: {
      main: "#A04545",
      light: "#FBEAEA",
      dark: "#7A3030",
      contrastText: "#FFFFFF",
    },

    info: {
      main: "#2F7FA3",
      contrastText: "#FFFFFF",
    },

    background: {
      default: "#F3F7FA",
      paper: "#FFFFFF",
    },

    text: {
      primary: "#223548",
      secondary: "#42596D",
      disabled: "#7E91A3",
    },

    divider: "#D7E1E8",

    grey: {
      50: "#FAFBFC",
      100: "#F3F7FA",
      200: "#E8EEF2",
      300: "#D7E1E8",
      400: "#95A5B3",
      500: "#5A6C7D",
      700: "#203040",
    },
  },

  typography: {
    fontFamily: "Inter, Roboto, Arial, sans-serif",

    h1: {
      fontSize: "32px",
      fontWeight: 700,
      lineHeight: 1.2,
      color: "#203040",
    },

    h2: {
      fontSize: "24px",
      fontWeight: 700,
      lineHeight: 1.25,
      color: "#203040",
    },

    h3: {
      fontSize: "18px",
      fontWeight: 700,
      lineHeight: 1.3,
      color: "#203040",
    },

    h4: {
      fontSize: "18px",
      fontWeight: 600,
      lineHeight: 1.3,
      color: "#203040",
    },

    body1: {
      fontSize: "15px",
      fontWeight: 400,
      lineHeight: 1.5,
      color: "#223548",
    },

    body2: {
      fontSize: "13px",
      fontWeight: 400,
      lineHeight: 1.5,
      color: "#42596D",
    },

    caption: {
      fontSize: "12px",
      fontWeight: 400,
      lineHeight: 1.4,
      color: "#64798B",
    },

    button: {
      fontSize: "14px",
      fontWeight: 700,
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
          backgroundColor: "#F3F7FA",
          color: "#203040",
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
          borderRadius: 7,
          boxShadow: "none",
          paddingLeft: 16,
          paddingRight: 16,
          textTransform: "none",

          "&.MuiButton-containedPrimary": {
            backgroundColor: "#2F7FA3",
            color: "#FFFFFF",
            boxShadow: "0 6px 14px rgba(47, 127, 163, 0.22)",

            "&:hover": {
              backgroundColor: "#1F5F7D",
              boxShadow: "0 8px 18px rgba(47, 127, 163, 0.28)",
            },

            "&.Mui-disabled": {
              backgroundColor: "#D7E1E8",
              color: "#95A5B3",
              boxShadow: "none",
            },
          },

          "&.MuiButton-outlinedPrimary": {
            borderColor: "#9DBCCB",
            color: "#1F5F7D",
            backgroundColor: "#FFFFFF",

            "&:hover": {
              borderColor: "#2F7FA3",
              backgroundColor: "#EDF7FB",
            },

            "&.Mui-disabled": {
              borderColor: "#D7E1E8",
              color: "#95A5B3",
              backgroundColor: "#F7FAFC",
            },
          },

          "&.MuiButton-outlinedWarning": {
            borderColor: "#D99A45",
            color: "#9B641B",
            backgroundColor: "#FFFFFF",

            "&:hover": {
              borderColor: "#C07F2A",
              backgroundColor: "#FFF4E4",
            },
          },

          "&.MuiButton-outlinedError": {
            borderColor: "#C86A6A",
            color: "#8F3838",
            backgroundColor: "#FFFFFF",

            "&:hover": {
              borderColor: "#A04545",
              backgroundColor: "#FBEAEA",
            },
          },

          "&.MuiButton-outlinedSuccess": {
            borderColor: "#6FA884",
            color: "#2E5F43",
            backgroundColor: "#FFFFFF",

            "&:hover": {
              borderColor: "#3F7D5A",
              backgroundColor: "#E8F3ED",
            },
          },

          "&.MuiButton-containedError": {
            backgroundColor: "#A04545",
            color: "#FFFFFF",

            "&:hover": {
              backgroundColor: "#7A3030",
            },
          },

          "&.MuiButton-containedWarning": {
            backgroundColor: "#C07F2A",
            color: "#FFFFFF",

            "&:hover": {
              backgroundColor: "#8A5A16",
            },
          },

          "&.MuiButton-containedSuccess": {
            backgroundColor: "#3F7D5A",
            color: "#FFFFFF",

            "&:hover": {
              backgroundColor: "#2E5F43",
            },
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid #E4EBF0",
          boxShadow: "0 4px 14px rgba(32, 48, 64, 0.08)",
        },

        rounded: {
          borderRadius: 10,
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #E4EBF0",
          boxShadow: "0 4px 14px rgba(32, 48, 64, 0.08)",
          borderRadius: 10,
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
            borderColor: "#CBD8E1",
          },

          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#4F9DBC",
          },

          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#2F7FA3",
            borderWidth: 1.5,
          },
        },

        input: {
          fontSize: "15px",
          color: "#203040",
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#5A6C7D",

          "&.Mui-focused": {
            color: "#2F7FA3",
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "#F3F7FA",
          color: "#203040",
          fontWeight: 700,
          borderBottom: "1px solid #E4EBF0",
        },

        body: {
          color: "#203040",
          borderBottom: "1px solid #E4EBF0",
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontSize: "12px",
          fontWeight: 600,
        },

        outlined: {
          backgroundColor: "#FFFFFF",
        },
      },
    },
  },
});