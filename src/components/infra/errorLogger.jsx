import { base44, isBase44Configured } from "@/api/base44Client";

export const ErrorTypes = {
  AI_FAILURE: "ai_failure",
  MENU_PARSE: "menu_parse",
  RECIPE_VALIDATION: "recipe_validation",
  API_ERROR: "api_error",
  PAYMENT_ERROR: "payment_error",
  MODERATION_ERROR: "moderation_error",
  UNKNOWN: "unknown",
};

function getCurrentPage() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.pathname || "";
}

function normalizeMessage(message) {
  return String(message || "Unknown error").slice(0, 1000);
}

export async function logError(
  errorType,
  message,
  context = {},
  severity = "medium"
) {
  const safeMessage = normalizeMessage(message);

  console.error("[BetterFood Error]", {
    errorType,
    severity,
    message: safeMessage,
    context,
  });

  if (!isBase44Configured) {
    return;
  }

  try {
    await base44.entities.ErrorLog.create({
      error_type: errorType || ErrorTypes.UNKNOWN,
      severity,
      message: safeMessage,
      context,
      page: getCurrentPage(),
      resolved: false,
      retry_count: 0,
    });
  } catch {
    // Never throw from logger
  }
}