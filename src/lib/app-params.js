const isBrowser = typeof window !== 'undefined';

const STORAGE_KEYS = {
  appId: 'better_food_app_id',
  accessToken: 'better_food_access_token',
  functionsVersion: 'better_food_functions_version',
  appBaseUrl: 'better_food_app_base_url',
  apiBaseUrl: 'better_food_api_base_url',
  fromUrl: 'better_food_from_url'
};

function getStorage() {
  if (!isBrowser) {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getQueryParam(name) {
  if (!isBrowser) {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function removeQueryParam(name) {
  if (!isBrowser) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (!params.has(name)) {
    return;
  }

  params.delete(name);

  const newUrl = `${window.location.pathname}${
    params.toString() ? `?${params.toString()}` : ''
  }${window.location.hash}`;

  window.history.replaceState({}, document.title, newUrl);
}

function readStoredValue(key) {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key, value) {
  const storage = getStorage();
  if (!storage || value == null || value === '') {
    return;
  }

  try {
    storage.setItem(key, value);
  } catch {
    // ignore storage write errors
  }
}

function removeStoredValue(key) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch {
    // ignore storage remove errors
  }
}

function resolveParam({
  queryKey,
  storageKey,
  envValue,
  persist = true,
  removeFromUrl = false
}) {
  const queryValue = getQueryParam(queryKey);

  if (queryValue) {
    if (persist) {
      writeStoredValue(storageKey, queryValue);
    }
    if (removeFromUrl) {
      removeQueryParam(queryKey);
    }
    return queryValue;
  }

  const storedValue = readStoredValue(storageKey);
  if (storedValue) {
    return storedValue;
  }

  if (envValue) {
    if (persist) {
      writeStoredValue(storageKey, envValue);
    }
    return envValue;
  }

  return null;
}

function shouldClearAccessToken() {
  return getQueryParam('clear_access_token') === 'true';
}

export function clearStoredAuthToken() {
  removeStoredValue(STORAGE_KEYS.accessToken);
  removeStoredValue('base44_access_token');
  removeStoredValue('token');
}

function buildAppParams() {
  if (shouldClearAccessToken()) {
    clearStoredAuthToken();
    removeQueryParam('clear_access_token');
  }

  const appBaseUrl = resolveParam({
    queryKey: 'app_base_url',
    storageKey: STORAGE_KEYS.appBaseUrl,
    envValue: import.meta.env.VITE_BASE44_APP_BASE_URL
  });

  const apiBaseUrl = resolveParam({
    queryKey: 'api_base_url',
    storageKey: STORAGE_KEYS.apiBaseUrl,
    envValue: import.meta.env.VITE_BASE44_API_BASE_URL
  });

  return {
    appId: resolveParam({
      queryKey: 'app_id',
      storageKey: STORAGE_KEYS.appId,
      envValue: import.meta.env.VITE_BASE44_APP_ID
    }),
    token: resolveParam({
      queryKey: 'access_token',
      storageKey: STORAGE_KEYS.accessToken,
      removeFromUrl: true
    }),
    functionsVersion: resolveParam({
      queryKey: 'functions_version',
      storageKey: STORAGE_KEYS.functionsVersion,
      envValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION
    }),
    appBaseUrl,
    apiBaseUrl,
    fromUrl: resolveParam({
      queryKey: 'from_url',
      storageKey: STORAGE_KEYS.fromUrl,
      envValue: isBrowser ? window.location.href : ''
    })
  };
}

export const appParams = buildAppParams();