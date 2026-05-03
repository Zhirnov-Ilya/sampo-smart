import { useState, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAdminEnterprises } from "../features/admin-enterprises/useAdminEnterprises";
import {
  useActivateUser,
  useAdminUsers,
  useCreateUser,
  useDeactivateUser,
  useResetUserPassword,
  useUpdateUser,
} from "../features/admin-users/useAdminUsers";
import {
  adminUserCreateSchema,
  adminUserUpdateSchema,
  resetPasswordSchema,
  type AdminUserCreateFormValues,
  type AdminUserUpdateFormValues,
  type ResetPasswordFormValues,
} from "../features/admin-users/adminUser.schema";
import { PageLoader } from "../components/PageLoader";
import { SectionHeader } from "../components/SectionHeader";
import { EmptyState } from "../components/EmptyState";
import { formatDateTime } from "../utils/format";

type EditMode = "create" | "edit";

const roleOptions = [
  { value: "super_admin", label: "SUPER_ADMIN" },
  { value: "enterprise_admin", label: "ENTERPRISE_ADMIN" },
  { value: "manager", label: "MANAGER" },
  { value: "analyst", label: "ANALYST" },
];

export function AdminUsersPage() {
  const { data: users, isLoading, isError } = useAdminUsers();
  const { data: enterprises } = useAdminEnterprises();

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deactivateMutation = useDeactivateUser();
  const activateMutation = useActivateUser();
  const resetPasswordMutation = useResetUserPassword();

  const [serverError, setServerError] = useState("");
  const [mode, setMode] = useState<EditMode>("create");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const formRef = useRef<HTMLDivElement | null>(null);
  const createFormRef = useRef<HTMLFormElement | null>(null);

  const createForm = useForm<AdminUserCreateFormValues>({
    resolver: zodResolver(adminUserCreateSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      role: "manager",
      is_active: true,
      enterprise_id: "",
    },
  });

  const updateForm = useForm<AdminUserUpdateFormValues>({
    resolver: zodResolver(adminUserUpdateSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: "manager",
      is_active: true,
      enterprise_id: "",
    },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: "",
    },
  });

  const handleCreate = async (data: AdminUserCreateFormValues) => {
    try {
      setServerError("");

      await createMutation.mutateAsync({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        role: data.role,
        is_active: data.is_active,
        enterprise_id:
          data.role === "super_admin"
            ? null
            : data.enterprise_id
            ? Number(data.enterprise_id)
            : null,
      });

      createForm.reset({
        full_name: "",
        email: "",
        password: "",
        role: "manager",
        is_active: true,
        enterprise_id: "",
      });

      setTimeout(() => {
        const form = createFormRef.current;
        if (!form) return;

        const emailInput = form.querySelector(
            `input[name="email"]`
        ) as HTMLInputElement | null;

        const passwordInput = form.querySelector(
            `input[name="password"]`
        ) as HTMLInputElement | null;

        if (emailInput) emailInput.value="";
        if (passwordInput) passwordInput.value="";
      }, 0);
    } catch (error: any) {
      setServerError(
        error?.response?.data?.detail || "Не удалось создать пользователя"
      );
    }
  };

  const handleUpdate = async (data: AdminUserUpdateFormValues) => {
    if (!editingUserId) return;

    try {
      setServerError("");

      await updateMutation.mutateAsync({
        userId: editingUserId,
        data: {
          full_name: data.full_name,
          email: data.email,
          role: data.role,
          is_active: data.is_active,
          enterprise_id:
            data.role === "super_admin"
              ? null
              : data.enterprise_id
              ? Number(data.enterprise_id)
              : null,
        },
      });

      setMode("create");
      setEditingUserId(null);

      updateForm.reset({
        full_name: "",
        email: "",
        role: "manager",
        is_active: true,
        enterprise_id: "",
      });
    } catch (error: any) {
      setServerError(
        error?.response?.data?.detail || "Не удалось обновить пользователя"
      );
    }
  };

  const handleEdit = (user: {
    id: number;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
    enterprise_id: number | null;
  }) => {
    setMode("edit");
    setEditingUserId(user.id);

    updateForm.reset({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      enterprise_id: user.enterprise_id ? String(user.enterprise_id) : "",
    });

    setTimeout(() => {
        formRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }, 0)
  };

  const handleCancelEdit = () => {
    setMode("create");
    setEditingUserId(null);

    updateForm.reset({
      full_name: "",
      email: "",
      role: "manager",
      is_active: true,
      enterprise_id: "",
    });
  };

  const handleDeactivate = async (userId: number) => {
    await deactivateMutation.mutateAsync(userId);
  };

  const handleActivate = async (userId: number) => {
    await activateMutation.mutateAsync(userId);
  };

  const openResetPasswordDialog = (userId: number) => {
    setResetUserId(userId);
    setResetError("");
    setResetSuccess("");
    resetForm.reset({ new_password: "" });
    setResetDialogOpen(true);
  };

  const closeResetPasswordDialog = () => {
    setResetDialogOpen(false);
    setResetUserId(null);
    setResetError("");
    setResetSuccess("");
  };

  const handleResetPassword = async (data: ResetPasswordFormValues) => {
    if (!resetUserId) return;

    try {
      setResetError("");
      setResetSuccess("");

      await resetPasswordMutation.mutateAsync({
        userId: resetUserId,
        data: {new_password: data.new_password},
      });

      setResetSuccess("Пароль успешно сброшен");
      resetForm.reset({ new_password: "" });
    } catch (error: any) {
      setResetError(
        error?.response?.data?.detail || "Не удалось сбросить пароль"
      );
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !users) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Пользователи
        </Typography>
        <Typography variant="body1">
          Не удалось загрузить список пользователей.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box ref={formRef}>
      <SectionHeader
        title="Пользователи"
        subtitle="Управление пользователями платформы"
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h3" gutterBottom>
              Список пользователей
            </Typography>

            {users.length === 0 ? (
              <EmptyState
                title="Пользователи отсутствуют"
                description="Создайте первого пользователя через форму справа."
              />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {users.map((user) => {
                  const enterpriseName =
                    enterprises?.find((e) => e.id === user.enterprise_id)?.name ??
                    "—";

                  return (
                    <Paper
                      key={user.id}
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
                            {user.full_name}
                          </Typography>

                          <Typography variant="body2">
                            {user.email}
                          </Typography>
                        </Box>

                        <Chip
                          label={user.is_active ? "Активен" : "Неактивен"}
                          color={user.is_active ? "success" : "default"}
                          size="small"
                        />
                      </Box>

                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Роль: {user.role}
                      </Typography>

                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Предприятие: {enterpriseName}
                      </Typography>

                      <Typography variant="caption" sx={{ display: "block", mb: 2 }}>
                        Создан: {formatDateTime(user.created_at)}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => handleEdit(user)}
                        >
                          Редактировать
                        </Button>

                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => openResetPasswordDialog(user.id)}
                        >
                          Сбросить пароль
                        </Button>

                        {user.is_active ? (
                          <Button
                            variant="outlined"
                            color="warning"
                            onClick={() => handleDeactivate(user.id)}
                            disabled={deactivateMutation.isPending}
                          >
                            Деактивировать
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            color="success"
                            onClick={() => handleActivate(user.id)}
                            disabled={activateMutation.isPending}
                          >
                            Активировать
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h3" gutterBottom>
              {mode === "create" ? "Добавить пользователя" : "Редактировать пользователя"}
            </Typography>

            {serverError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {serverError}
              </Alert>
            )}

            {mode === "create" ? (
              <Box
                ref={createFormRef}
                component="form"
                key="create-user-form"
                autoComplete="off"
                onSubmit={createForm.handleSubmit(handleCreate)}
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <Controller
                  name="full_name"
                  control={createForm.control}
                  render={({ field }) => (
                    <TextField
                      label="ФИО"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      error={!!createForm.formState.errors.full_name}
                      helperText={createForm.formState.errors.full_name?.message}
                    />
                  )}
                />

                <Controller
                  name="email"
                  control={createForm.control}
                  render={({ field }) => (
                    <TextField
                      autoComplete="off"
                      label="Email"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      error={!!createForm.formState.errors.email}
                      helperText={createForm.formState.errors.email?.message}
                    />
                  )}
                />

                <Controller
                  name="password"
                  control={createForm.control}
                  render={({ field }) => (
                    <TextField
                      slotProps={{
                            htmlInput: {
                                name: "admin_user_create_pass_field",
                            },
                      }}
                      autoComplete="off"
                      label="Пароль"
                      type="password"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      error={!!createForm.formState.errors.password}
                      helperText={createForm.formState.errors.password?.message}
                    />
                  )}
                />

                <Controller
                  name="role"
                  control={createForm.control}
                  render={({ field }) => (
                    <TextField
                      label="Роль"
                      select
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      error={!!createForm.formState.errors.role}
                      helperText={createForm.formState.errors.role?.message}
                    >
                      {roleOptions.map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          {role.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <Controller
                  name="enterprise_id"
                  control={createForm.control}
                  render={({ field }) => (
                    <TextField
                      label="Предприятие"
                      select
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      disabled={createForm.watch("role") === "super_admin"}
                      error={!!createForm.formState.errors.enterprise_id}
                      helperText={createForm.formState.errors.enterprise_id?.message}
                    >
                      <MenuItem value="">Не выбрано</MenuItem>
                      {enterprises?.map((enterprise) => (
                        <MenuItem key={enterprise.id} value={String(enterprise.id)}>
                          {enterprise.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <Controller
                  name="is_active"
                  control={createForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Активен"
                    />
                  )}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={createMutation.isPending || createForm.formState.isSubmitting}
                >
                  {createMutation.isPending || createForm.formState.isSubmitting
                    ? "Создание..."
                    : "Создать"}
                </Button>
              </Box>
            ) : (
              <Box
                component="form"
                autoComplete="off"
                key={`edit-user-form-${editingUserId}`}
                onSubmit={updateForm.handleSubmit(handleUpdate)}
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <Controller
                  name="full_name"
                  control={updateForm.control}
                  render={({ field }) => (
                    <TextField
                      label="ФИО"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      error={!!updateForm.formState.errors.full_name}
                      helperText={updateForm.formState.errors.full_name?.message}
                    />
                  )}
                />

                <Controller
                  name="email"
                  control={updateForm.control}
                  render={({ field }) => (
                    <TextField
                      label="Email"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      error={!!updateForm.formState.errors.email}
                      helperText={updateForm.formState.errors.email?.message}
                    />
                  )}
                />

                <Controller
                  name="role"
                  control={updateForm.control}
                  render={({ field }) => (
                    <TextField
                      label="Роль"
                      select
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      error={!!updateForm.formState.errors.role}
                      helperText={updateForm.formState.errors.role?.message}
                    >
                      {roleOptions.map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          {role.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <Controller
                  name="enterprise_id"
                  control={updateForm.control}
                  render={({ field }) => (
                    <TextField
                      label="Предприятие"
                      select
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      disabled={updateForm.watch("role") === "super_admin"}
                      error={!!updateForm.formState.errors.enterprise_id}
                      helperText={updateForm.formState.errors.enterprise_id?.message}
                    >
                      <MenuItem value="">Не выбрано</MenuItem>
                      {enterprises?.map((enterprise) => (
                        <MenuItem key={enterprise.id} value={String(enterprise.id)}>
                          {enterprise.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <Controller
                  name="is_active"
                  control={updateForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Активен"
                    />
                  )}
                />

                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={updateMutation.isPending || updateForm.formState.isSubmitting}
                  >
                    {updateMutation.isPending || updateForm.formState.isSubmitting
                      ? "Сохранение..."
                      : "Сохранить"}
                  </Button>

                  <Button
                    type="button"
                    variant="outlined"
                    color="primary"
                    onClick={handleCancelEdit}
                  >
                    Отмена
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={resetDialogOpen} onClose={closeResetPasswordDialog} fullWidth maxWidth="sm">
        <DialogTitle>Сбросить пароль</DialogTitle>

        <Box
          component="form"
          onSubmit={resetForm.handleSubmit(handleResetPassword)}
        >
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {resetError && <Alert severity="error">{resetError}</Alert>}
            {resetSuccess && <Alert severity="success">{resetSuccess}</Alert>}

            <Controller
              name="new_password"
              control={resetForm.control}
              render={({ field }) => (
                <TextField
                  label="Новый пароль"
                  type="password"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  error={!!resetForm.formState.errors.new_password}
                  helperText={resetForm.formState.errors.new_password?.message}
                />
              )}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={closeResetPasswordDialog} variant="outlined" color="primary">
              Закрыть
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Сброс..." : "Сбросить пароль"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}