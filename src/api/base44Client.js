import { createClient } from "@base44/sdk";
import { appParams } from "@/lib/app-params";

const {
  appId,
  token,
  functionsVersion,
  appBaseUrl,
  apiBaseUrl,
} = appParams;

function normalizeUrl(url) {
  return String(url || "").replace(/\/+$/, "");
}

function resolveServerUrl() {
  if (apiBaseUrl) {
    return normalizeUrl(apiBaseUrl);
  }

  if (appBaseUrl) {
    return `${normalizeUrl(appBaseUrl)}/api`;
  }

  return "";
}

export const base44Config = Object.freeze({
  appId: appId || "",
  token: token || "",
  functionsVersion: functionsVersion || "",
  appBaseUrl: normalizeUrl(appBaseUrl),
  apiBaseUrl: normalizeUrl(apiBaseUrl),
  serverUrl: resolveServerUrl(),
});

export const isBase44Configured = Boolean(
  base44Config.appId && base44Config.serverUrl
);

if (!isBase44Configured) {
  console.error("[Better Food] Base44 is not fully configured.");
}

export const base44 = createClient({
  appId: base44Config.appId,
  token: base44Config.token,
  functionsVersion: base44Config.functionsVersion,
  serverUrl: base44Config.serverUrl,
  requiresAuth: false,
  appBaseUrl: base44Config.appBaseUrl,
});

export function assertBase44Configured() {
  if (!isBase44Configured) {
    throw new Error(
      "Base44 is not configured. Missing appId and/or appBaseUrl/apiBaseUrl."
    );
  }
}

export async function safeGetCurrentUser() {
  if (!isBase44Configured) {
    return null;
  }

  try {
    const user = await base44.auth.me();
    return user ?? null;
  } catch {
    return null;
  }
}

export async function safeRedirectToLogin(redirectUrl = "") {
  if (!isBase44Configured) {
    return false;
  }

  try {
    await base44.auth.redirectToLogin(redirectUrl || window.location.href);
    return true;
  } catch {
    return false;
  }
}

export async function safeLogout(redirectUrl = "") {
  if (!isBase44Configured) {
    return false;
  }

  try {
    await base44.auth.logout(redirectUrl || window.location.href);
    return true;
  } catch {
    return false;
  }
}