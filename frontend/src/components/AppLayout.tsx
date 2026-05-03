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

import { useMe } from "../features/auth/useMe";

const drawerExpandedWidth = 248;
const drawerCollapsedWidth = 84;

const menuItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    text: "Главная",
    icon: DashboardOutlinedIcon,
  },
  {
    label: "Equipment",
    path: "/equipment",
    text: "Оборудование",
    icon: PrecisionManufacturingOutlinedIcon,
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
    lable: "Admin Users",
    path: "/admin/users",
    text: "Пользователи",
    icon: GroupIcon,
  }
];

export function AppLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useMe();

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
          backgroundColor: "background.paper",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
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
            <IconButton onClick={toggleDrawer} color="inherit">
              <MenuIcon />
            </IconButton>

            <Box>
              <Typography variant="h3" component="div">
                Sampo Smart
              </Typography>

              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {user?.enterprise_name ?? "Platform administration"}
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
                  backgroundColor: "#FAFBFC",
                  minWidth: 180,
                }}
              >
                <Typography variant="body1" sx={{ lineHeight: 1.2 }}>
                  {user.full_name}
                </Typography>
                <Typography variant="caption">
                  {user.role}
                </Typography>
              </Paper>
            )}

            <Button variant="outlined" color="primary" onClick={handleLogout}>
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
            backgroundColor: "#FFFFFF",
            borderRight: "1px solid #D0D5D9",
            overflowX: "hidden",
            transition: "width 0.2s ease",
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
            {open && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  px: 1.5,
                  mb: 1,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
              </Typography>
            )}

            <List sx={{ p: 0 }}>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <ListItemButton
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    sx={{
                      mb: 0.75,
                      px: 1.5,
                      py: 1.25,
                      borderRadius: 2,
                      alignItems: "center",
                      justifyContent: open ? "flex-start" : "center",
                      backgroundColor: isActive ? "#E8EBED" : "transparent",
                      border: isActive
                        ? "1px solid #D0D5D9"
                        : "1px solid transparent",
                      "&:hover": {
                        backgroundColor: isActive ? "#E8EBED" : "#F5F7F9",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 4,
                        alignSelf: "stretch",
                        borderRadius: 999,
                        backgroundColor: isActive ? "#3E5C76" : "transparent",
                        mr: open ? 1.5 : 0,
                      }}
                    />

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mr: open ? 1.5 : 0,
                        color: isActive ? "primary.main" : "text.secondary",
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>

                    {open && (
                      <ListItemText
                        primary={
                          <Typography
                            sx={{
                              fontSize: 15,
                              fontWeight: isActive ? 600 : 400,
                              color: isActive ? "primary.main" : "text.primary",
                            }}
                          >
                            {item.text}
                          </Typography>
                        }
                      />
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          </Box>

          {open && (
            <Box sx={{ p: 2 }}>
              <Divider sx={{ mb: 2 }} />

              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#FAFBFC",
                }}
              >
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Рабочая среда
                </Typography>
                <Typography variant="caption">
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