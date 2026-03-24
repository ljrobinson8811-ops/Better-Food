/**
 * Audit log for sensitive admin actions and data-access events
 * Written to UserAnalytics entity with event_name prefix "audit_"
 */

import { base44 } from "@/api/base44Client";

export const AuditLog = {
  /**
   * @param {string} action  - e.g. "admin.resolve_error", "user.photo_approve"
   * @param {object} context - relevant IDs and data
   */
  async record(action, context = {}) {
    await base44.entities.UserAnalytics.create({
      event_name: `audit_${action}`,
      page:       window.location.pathname,
      metadata:   { ...context, timestamp: new Date().toISOString() },
      session_id: sessionStorage.getItem("bf_sid") ?? "unknown",
    }).catch(() => {});
  },

  actions: {
    ADMIN_ERROR_RESOLVE:   "admin.error_resolve",
    ADMIN_PHOTO_APPROVE:   "admin.photo_approve",
    ADMIN_PHOTO_REJECT:    "admin.photo_reject",
    ADMIN_MENU_DISCOVER:   "admin.menu_discover",
    USER_DATA_EXPORT:      "user.data_export",
    USER_PREMIUM_CHANGE:   "user.premium_change",
    USER_RECIPE_DELETE:    "user.recipe_delete",
  },
};