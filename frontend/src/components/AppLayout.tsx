import { useState } from "react";
import type { PropsWithChildren } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import GroupIcon from "@mui/icons-material/Group";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";

import { useMe } from "../features/auth/useMe";
import { getUserRoleLabel } from "../utils/format";

import {
  isEnterpriseAdmin,
  isManagerOrAnalyst,
  isSuperAdmin,
} from "../utils/roles";

const drawerExpandedWidth = 248;
const drawerCollapsedWidth = 84;

const sidebarColors = {
  background: "#FFFFFF",
  backgroundDark: "#F6FAFD",
  border: "#E1EAF0",

  active: "#E7F1F7",
  activeHover: "#DCEBF4",
  hover: "#F5F9FC",

  text: "#244256",
  textMuted: "#4F6A7E",
  activeText: "#2F5F7A",
};

const menuItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    text: "Главная",
    icon: DashboardOutlinedIcon,
  },
  {
    label: "Downtimes",
    path: "/downtimes",
    text: "Простои",
    icon: WarningAmberOutlinedIcon,
  },
  {
    label: "Hypotheses",
    path: "/hypotheses",
    text: "Гипотезы",
    icon: LightbulbOutlinedIcon,
  },
  {
    label: "Admin Enterprises",
    path: "/admin/enterprises",
    text: "Предприятия",
    icon: HomeWorkIcon,
  },
  {
    label: "Admin Users",
    path: "/admin/users",
    text: "Пользователи",
    icon: GroupIcon,
  },
  {
    label: "Admin Equipment",
    path: "/admin/equipment",
    text: "Оборудование",
    icon: PrecisionManufacturingOutlinedIcon,
  },
  {
    label: "Admin Equipment Types",
    path: "/admin/equipment-types",
    text: "Типы оборудования",
    icon: BuildOutlinedIcon,
  },
];

export function AppLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useMe();

  const availableMenuItems = menuItems.filter((item) => {
    if (!user) return false;

    if (isSuperAdmin(user.role)) {
      return true;
    }

    if (isEnterpriseAdmin(user.role)) {
      return item.path !== "/admin/enterprises";
    }

    if (isManagerOrAnalyst(user.role)) {
      return ![
        "/admin/enterprises",
        "/admin/users",
        "/admin/equipment",
        "/admin/equipment-types",
      ].includes(item.path);
    }

    return false;
  });

  const [open, setOpen] = useState(true);

  const toggleDrawer = () => {
    setOpen((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "background.default",
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "#23455B",
          color: "#F7FBFF",
          borderBottom: "1px solid rgba(255, 255, 255, 0.10)",
          boxShadow: "0 4px 14px rgba(35, 69, 91, 0.18)",
        }}
      >
        <Toolbar
          sx={{
            minHeight: "72px !important",
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton
              onClick={toggleDrawer}
              sx={{
                color: "#FFFFFF",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                },
              }}
            >
              <MenuIcon />
            </IconButton>

            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="Sampo Smart"
                sx={{
                  width: 32,
                  height: 32,
                  objectFit: "contain",
                }}
              />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: 1.15,
                  color: "#FFFFFF",
                }}
              >
                Sampo Smart
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 400,
                  lineHeight: 1.3,
                  color: "rgba(247, 251, 255, 0.72)",
                  mt: 0.25,
                }}
              >
                {user?.enterprise_name ?? "Главный администратор платформы"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {user && (
             <Paper
              sx={{
                px: 2,
                py: 1,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "none",
                minWidth: 160,
              }}
            >
              <Typography
                sx={{
                  lineHeight: 1.2,
                  color: "#FFFFFF",
                  fontSize: 15,
                  fontWeight: 500,
                }}
              >
                {user.full_name}
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 400,
                  lineHeight: 1.3,
                  color: "rgba(247, 251, 255, 0.70)",
                  mt: 0.25,
                }}
              >
                {getUserRoleLabel(user.role)}
              </Typography>
            </Paper>
            )}

            <Button
              variant="outlined"
              onClick={handleLogout}
              sx={{
                minHeight: 40,
                px: 2,
                color: "#FFFFFF",
                borderColor: "rgba(255,255,255,0.35)",
                backgroundColor: "transparent",
                fontWeight: 600,

                "&:hover": {
                  borderColor: "#FFFFFF",
                  backgroundColor: "rgba(255,255,255,0.08)",
                },
              }}
            >
              Выйти
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerExpandedWidth : drawerCollapsedWidth,
          flexShrink: 0,

          "& .MuiDrawer-paper": {
            width: open ? drawerExpandedWidth : drawerCollapsedWidth,
            boxSizing: "border-box",
            backgroundColor: sidebarColors.background,
            color: sidebarColors.text,
            borderRight: `1px solid ${sidebarColors.border}`,
            pt: 5,
            px: 1,
            transition: "width 0.2s ease",
            overflowX: "hidden",
          },
        }}
      >
        <Toolbar sx={{ minHeight: "72px !important" }} />

        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ px: 1.5, pt: 2 }}>
            <List sx={{ p: 0 }}>
              {availableMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <ListItemButton
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    sx={{
                      mb: 0.75,
                      px: 1.5,
                      py: 1.15,
                      borderRadius: 2,
                      alignItems: "center",
                      justifyContent: open ? "flex-start" : "center",

                      color: isActive ? sidebarColors.activeText : sidebarColors.textMuted,
                      backgroundColor: isActive ? sidebarColors.active : "transparent",
                      border: isActive
                        ? "1px solid #D7E6F0"
                        : "1px solid transparent",

                      "&:hover": {
                        backgroundColor: isActive
                          ? sidebarColors.activeHover
                          : sidebarColors.hover,
                        color: isActive ? sidebarColors.activeText : sidebarColors.text,
                      },

                      "& .MuiSvgIcon-root": {
                        color: "inherit",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 3,
                        alignSelf: "stretch",
                        borderRadius: 999,
                        backgroundColor: isActive ? "#2F6E8A" : "transparent",
                        opacity: isActive ? 1 : 0,
                        mr: open ? 1.5 : 0,
                      }}
                    />

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: open ? 28 : "auto",
                        mr: open ? 1.5 : 0,
                        color: "inherit",
                      }}
                    >
                      <Icon
                        sx={{
                          color: "inherit",
                          fontSize: 21,
                        }}
                      />
                    </Box>

                    {open && (
                      <ListItemText
                        primary={item.text}
                        slotProps={{
                          primary: {
                            sx: {
                              color: "inherit",
                              fontSize: 15,
                              fontWeight: isActive ? 500 : 400,
                            },
                          },
                        }}
                      />
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          </Box>

          {open && (
            <Box sx={{ p: 2 }}>
              <Divider
                sx={{
                  mb: 2,
                  borderColor: "rgba(255, 255, 255, 0.18)",
                }}
              />

              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#F6FAFD",
                  border: "1px solid #E1EAF0",
                  boxShadow: "none",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#244256",
                    fontWeight: 600,
                  }}
                >
                  Рабочая среда
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1,
                    color: "#6F8798",
                    lineHeight: 1.6,
                  }}
                >
                  Система мониторинга оборудования, простоев и AI-гипотез.
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 2, md: 4 },
          py: 4,
        }}
      >
        <Toolbar sx={{ minHeight: "72px !important" }} />

        <Box
          sx={{
            maxWidth: 1440,
            mx: "auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}