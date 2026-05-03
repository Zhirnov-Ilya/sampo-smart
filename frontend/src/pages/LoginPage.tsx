import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Paper, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

import { loginSchema } from "../features/auth/auth.schema";
import type { LoginFormValues } from "../features/auth/auth.schema";

import { loginRequest } from "../api/auth";


export function LoginPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setServerError("");

      const response = await loginRequest(data);

      localStorage.setItem("access_token", response.access_token);

      navigate("/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setServerError(
          error.response?.data?.detail || "Ошибка входа. Проверьте данные."
        );
      } else {
        setServerError("Неизвестная ошибка.");
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        backgroundColor: "background.default",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 440,
          p: 4,
          borderRadius: 2,
          backgroundColor: "background.paper",
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Sampo Smart
        </Typography>

        <Typography variant="body2" sx={{ mb: 3 }}>
          Вход в систему аналитики производственных улучшений
        </Typography>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <TextField
            label="Email"
            type="email"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <TextField
            label="Пароль"
            type="password"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Вход..." : "Войти"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}