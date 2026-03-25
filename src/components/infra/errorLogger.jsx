import { base44 } from "@/api/base44Client";

export const ErrorTypes = {
  AI_FAILURE: "ai_failure",
  MENU_PARSE: "menu_parse",
  RECIPE_VALIDATION: "recipe_validation",
  API_ERROR: "api_error",
  PAYMENT_ERROR: "payment_error",
  MODERATION_ERROR: "moderation_error",
  UNKNOWN: "unknown",
};

export async function logError(errorType, message, context = {}, severity = "medium") {
  try {
    await base44.entities.ErrorLog.create({
      error_type: errorType,
      severity,
      message: String(message).slice(0, 1000),
      context,
      page: window.location.pathname,
      resolved: false,
      retry_count: 0,
    });
  } catch (e) {
    console.error("[ErrorLogger] Failed to log:", e);
  }
}