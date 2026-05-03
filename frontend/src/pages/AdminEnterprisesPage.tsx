import { useState, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Switch,
  TextField,
  Typography,
  FormControlLabel,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  useActivateEnterprise,
  useAdminEnterprises,
  useCreateEnterprise,
  useDeactivateEnterprise,
  useUpdateEnterprise,
} from "../features/admin-enterprises/useAdminEnterprises";
import {adminEnterpriseSchema} from "../features/admin-enterprises/adminEnterprise.schema";
import type{ AdminEnterpriseFormValues} from "../features/admin-enterprises/adminEnterprise.schema";
import { PageLoader } from "../components/PageLoader";
import { SectionHeader } from "../components/SectionHeader";
import { EmptyState } from "../components/EmptyState";
import { formatDateTime } from "../utils/format";


type EditMode = "create" | "edit";

export function AdminEnterprisesPage() {
  const { data: enterprises, isLoading, isError } = useAdminEnterprises();
  const createMutation = useCreateEnterprise();
  const updateMutation = useUpdateEnterprise();
  const deactivateMutation = useDeactivateEnterprise();
  const activateMutation = useActivateEnterprise();

  const [serverError, setServerError] = useState("");
  const [mode, setMode] = useState<EditMode>("create");
  const [editingEnterpriseId, setEditingEnterpriseId] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AdminEnterpriseFormValues>({
    resolver: zodResolver(adminEnterpriseSchema),
    defaultValues: {
      name: "",
      industry: "",
      contact_email: "",
      is_active: true,
    },
  });

  const onSubmit = async (data: AdminEnterpriseFormValues) => {
    try {
      setServerError("");

      const payload = {
        name: data.name,
        industry: data.industry || null,
        contact_email: data.contact_email || null,
        is_active: data.is_active,
      };

      if (mode === "create") {
        await createMutation.mutateAsync(payload);
      } else if (editingEnterpriseId) {
        await updateMutation.mutateAsync({
          enterpriseId: editingEnterpriseId,
          data: payload,
        });
      }

      setMode("create");
      setEditingEnterpriseId(null);

      reset({
        name: "",
        industry: "",
        contact_email: "",
        is_active: true,
      });
    } catch (error: any) {
      setServerError(
        error?.response?.data?.detail || "Не удалось сохранить предприятие"
      );
    }
  };

  const handleEdit = (enterprise: {
    id: number;
    name: string;
    industry: string | null;
    contact_email: string | null;
    is_active: boolean;
  }) => {
    setMode("edit");
    setEditingEnterpriseId(enterprise.id);

    reset({
      name: enterprise.name,
      industry: enterprise.industry || "",
      contact_email: enterprise.contact_email || "",
      is_active: enterprise.is_active,
    });

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const handleCancelEdit = () => {
    setMode("create");
    setEditingEnterpriseId(null);

    reset({
      name: "",
      industry: "",
      contact_email: "",
      is_active: true,
    });
  };

  const handleDeactivate = async (enterpriseId: number) => {
    await deactivateMutation.mutateAsync(enterpriseId);
  };

  const handleActivate = async (enterpriseId: number) => {
    await activateMutation.mutateAsync(enterpriseId);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !enterprises) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Предприятия
        </Typography>
        <Typography variant="body1">
          Не удалось загрузить список предприятий.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box ref={formRef}>
      <SectionHeader
        title="Предприятия"
        subtitle="Управление предприятиями клиентов платформы"
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h3" gutterBottom>
              Список предприятий
            </Typography>

            {enterprises.length === 0 ? (
              <EmptyState
                title="Предприятия пока отсутствуют"
                description="Создай первое предприятие через форму справа."
              />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {enterprises.map((enterprise) => (
                  <Paper
                    key={enterprise.id}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      backgroundColor: "#FAFBFC",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 2,
                        mb: 1.5,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          {enterprise.name}
                        </Typography>

                        <Typography variant="body2">
                          ID Предприятия: {enterprise.id}
                        </Typography>
                      </Box>

                      <Chip
                        label={enterprise.is_active ? "Активно" : "Неактивно"}
                        color={enterprise.is_active ? "success" : "default"}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Отрасль: {enterprise.industry || "—"}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Email: {enterprise.contact_email || "—"}
                    </Typography>

                    <Typography variant="caption" sx={{ display: "block", mb: 2 }}>
                      Создано: {formatDateTime(enterprise.created_at)}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleEdit(enterprise)}
                      >
                        Редактировать
                      </Button>

                      {enterprise.is_active ? (
                        <Button
                          variant="outlined"
                          color="warning"
                          onClick={() => handleDeactivate(enterprise.id)}
                          disabled={deactivateMutation.isPending}
                        >
                          Деактивировать
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          color="success"
                          onClick={() => handleActivate(enterprise.id)}
                          disabled={activateMutation.isPending}
                        >
                          Активировать
                        </Button>
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h3" gutterBottom>
              {mode === "create" ? "Добавить предприятие" : "Редактировать предприятие"}
            </Typography>

            {serverError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {serverError}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            label="Название предприятия"
                            value={field.value}
                            onChange={field.onChange}
                            inputRef={field.ref}
                            onBlur={field.onBlur}
                            error={!!errors.name}
                            helperText={errors.name?.message}
                        />
                    )}
                />

                <Controller
                    name="industry"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            label="Отрасль"
                            value={field.value}
                            onChange={field.onChange}
                            inputRef={field.ref}
                            onBlur={field.onBlur}
                            error={!!errors.industry}
                            helperText={errors.industry?.message}
                        />
                    )}
                />

                <Controller
                    name="contact_email"
                    control={control}
                    render = {({ field }) => (
                        <TextField
                            label="Контактный email"
                            value={field.value}
                            onChange={field.onChange}
                            inputRef={field.ref}
                            onBlur={field.onBlur}
                            error={!!errors.contact_email}
                            helperText={errors.contact_email?.message}
                        />
                    )}
                />
                
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Активно"
                  />
                )}
              />

              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={
                    isSubmitting ||
                    createMutation.isPending ||
                    updateMutation.isPending
                  }
                >
                  {mode === "create"
                    ? createMutation.isPending || isSubmitting
                      ? "Создание..."
                      : "Создать"
                    : updateMutation.isPending || isSubmitting
                    ? "Сохранение..."
                    : "Сохранить"}
                </Button>

                {mode === "edit" && (
                  <Button
                    type="button"
                    variant="outlined"
                    color="primary"
                    onClick={handleCancelEdit}
                  >
                    Отмена
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}