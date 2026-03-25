// Super admin configuration — change this to update the admin email
export const SUPER_ADMIN_EMAIL = "ljrobinson8811@gmail.com";

/**
 * Returns true if the given user object is the super admin.
 * Works for both Google sign-in and email sign-in.
 */
export function isSuperAdmin(user) {
  if (!user?.email) return false;
  return user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}