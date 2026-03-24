export const SUPER_ADMIN_EMAIL = "ljrobinson8811@gmail.com";

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isSuperAdmin(user) {
  return normalizeEmail(user?.email) === normalizeEmail(SUPER_ADMIN_EMAIL);
}