import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  base44,
  isBase44Configured,
  safeGetCurrentUser,
  safeLogout,
  safeRedirectToLogin,
} from "@/api/base44Client";
import { appParams, clearStoredAuthToken } from "@/lib/app-params";

const AuthContext = createContext(null);

function normalizeAuthError(error) {
  const status = error?.status ?? error?.response?.status;
  const reason =
    error?.data?.extra_data?.reason ??
    error?.response?.data?.extra_data?.reason ??
    error?.reason ??
    null;

  if (reason === "user_not_registered") {
    return {
      type: "user_not_registered",
      message: "User is not registered for this app.",
    };
  }

  if (reason === "auth_required" || status === 401 || status === 403) {
    return {
      type: "auth_required",
      message: "Authentication required.",
    };
  }

  return {
    type: "unknown",
    message: error?.message || "Unable to authenticate.",
  };
}

function getCurrentUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.href;
}

async function fetchPublicSettings() {
  if (!isBase44Configured || !appParams.appId) {
    return {
      id: null,
      public_settings: {},
    };
  }

  const baseUrl = appParams.apiBaseUrl || appParams.appBaseUrl;
  if (!baseUrl) {
    return {
      id: null,
      public_settings: {},
    };
  }

  const normalizedBaseUrl = String(baseUrl).replace(/\/+$/, "");
  const endpoint = `${normalizedBaseUrl}/api/apps/public/prod/public-settings/by-id/${appParams.appId}`;

  const headers = {
    "X-App-Id": appParams.appId,
  };

  if (appParams.token) {
    headers.Authorization = `Bearer ${appParams.token}`;
  }

  const response = await fetch(endpoint, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    let body = null;

    try {
      body = await response.json();
    } catch {
      body = null;
    }

    const error = new Error("Failed to fetch app public settings.");
    error.status = response.status;
    error.data = body;
    throw error;
  }

  return response.json();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);

  const loginRedirectTriggeredRef = useRef(false);

  const checkAppState = useCallback(async () => {
    setIsLoadingPublicSettings(true);
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      const publicSettings = await fetchPublicSettings();
      setAppPublicSettings(publicSettings);
      setIsLoadingPublicSettings(false);

      if (!appParams.token) {
        setUser(null);
        setIsLoadingAuth(false);
        return;
      }

      const currentUser = await safeGetCurrentUser();

      if (currentUser) {
        setUser(currentUser);
        setIsLoadingAuth(false);
        return;
      }

      setUser(null);
      setAuthError({
        type: "auth_required",
        message: "Authentication required.",
      });
      setIsLoadingAuth(false);
    } catch (error) {
      const normalized = normalizeAuthError(error);

      if (normalized.type === "auth_required") {
        clearStoredAuthToken();
        setUser(null);
      }

      setAuthError(normalized);
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  const logout = useCallback(async (redirectUrl = getCurrentUrl()) => {
    clearStoredAuthToken();
    setUser(null);
    setAuthError(null);

    const success = await safeLogout(redirectUrl);

    if (!success && typeof window !== "undefined" && redirectUrl) {
      window.location.assign(redirectUrl);
    }
  }, []);

  const navigateToLogin = useCallback(
    async (redirectUrl = getCurrentUrl()) => {
      if (loginRedirectTriggeredRef.current) {
        return;
      }

      loginRedirectTriggeredRef.current = true;

      const redirected = await safeRedirectToLogin(redirectUrl);

      if (redirected) {
        return;
      }

      if (appParams.appBaseUrl && typeof window !== "undefined") {
        const loginUrl = `${appParams.appBaseUrl.replace(
          /\/+$/,
          ""
        )}/login?redirect_url=${encodeURIComponent(redirectUrl)}`;

        window.location.assign(loginUrl);
      }
    },
    []
  );

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await safeGetCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const value = useMemo(() => {
    const isAuthenticated = Boolean(user);
    const isBootstrapping = isLoadingAuth || isLoadingPublicSettings;
    const shouldShowLoginRedirect = authError?.type === "auth_required";
    const canAccessApp =
      !authError ||
      shouldShowLoginRedirect ||
      authError.type === "user_not_registered";

    return {
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      isBootstrapping,
      authError,
      appPublicSettings,
      canAccessApp,
      shouldShowLoginRedirect,
      logout,
      navigateToLogin,
      checkAppState,
      refreshUser,
    };
  }, [
    user,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    appPublicSettings,
    logout,
    navigateToLogin,
    checkAppState,
    refreshUser,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}