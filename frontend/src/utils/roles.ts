export function normalizeUserRole(role: string | null | undefined): string {
  return role?.toUpperCase() ?? "";
}

export function isSuperAdmin(role: string | null | undefined): boolean {
  return normalizeUserRole(role) === "SUPER_ADMIN";
}

export function isEnterpriseAdmin(role: string | null | undefined): boolean {
  return normalizeUserRole(role) === "ENTERPRISE_ADMIN";
}

export function isManagerOrAnalyst(role: string | null | undefined): boolean {
  const normalizedRole = normalizeUserRole(role);

  return normalizedRole === "MANAGER" || normalizedRole === "ANALYST";
}