import API_URL from "../config/api";

const ACCESS_TOKEN_KEY =
  "client-connect-token";

const REFRESH_TOKEN_KEY =
  "client-connect-refresh-token";

const USER_KEY =
  "client-connect-user";

const CURRENT_USER_KEY =
  "client-connect-current-user";

const PAGE_KEY =
  "client-connect-current-page";

let refreshPromise = null;
let interceptorInstalled = false;

/* =========================================================
   STORAGE
========================================================= */

function getStorageContaining(
  key
) {
  if (
    localStorage.getItem(key)
  ) {
    return localStorage;
  }

  if (
    sessionStorage.getItem(key)
  ) {
    return sessionStorage;
  }

  return null;
}

export function getAccessToken() {
  return (
    localStorage.getItem(
      ACCESS_TOKEN_KEY
    ) ||
    sessionStorage.getItem(
      ACCESS_TOKEN_KEY
    ) ||
    ""
  );
}

export function getRefreshToken() {
  return (
    localStorage.getItem(
      REFRESH_TOKEN_KEY
    ) ||
    sessionStorage.getItem(
      REFRESH_TOKEN_KEY
    ) ||
    ""
  );
}

export function getStoredUser() {
  const raw =
    localStorage.getItem(USER_KEY) ||
    sessionStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* =========================================================
   SAVE LOGIN SESSION

   persistent = true  -> localStorage
   persistent = false -> sessionStorage
========================================================= */

export function saveAuthSession({
  accessToken,
  refreshToken,
  user,
  persistent = false,
}) {
  clearAuthStorage();

  const storage =
    persistent
      ? localStorage
      : sessionStorage;

  if (accessToken) {
    storage.setItem(
      ACCESS_TOKEN_KEY,
      accessToken
    );
  }

  if (refreshToken) {
    storage.setItem(
      REFRESH_TOKEN_KEY,
      refreshToken
    );
  }

  if (user) {
    const serialized =
      JSON.stringify(user);

    storage.setItem(
      USER_KEY,
      serialized
    );

    /*
      Keep this legacy key because some existing UI code
      may still depend on it.
    */
    localStorage.setItem(
      CURRENT_USER_KEY,
      serialized
    );
  }

  if (user?.role) {
    localStorage.setItem(
      PAGE_KEY,
      user.role
    );
  }
}

/* =========================================================
   UPDATE ROTATED TOKENS

   Preserve whichever storage type was selected at login.
========================================================= */

export function updateTokens({
  accessToken,
  refreshToken,
}) {
  const storage =
    getStorageContaining(
      REFRESH_TOKEN_KEY
    ) ||
    getStorageContaining(
      ACCESS_TOKEN_KEY
    ) ||
    sessionStorage;

  if (accessToken) {
    storage.setItem(
      ACCESS_TOKEN_KEY,
      accessToken
    );
  }

  if (refreshToken) {
    storage.setItem(
      REFRESH_TOKEN_KEY,
      refreshToken
    );
  }
}

/* =========================================================
   CLEAR AUTHENTICATION STORAGE
========================================================= */

export function clearAuthStorage() {
  const keys = [
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_KEY,
  ];

  keys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  localStorage.removeItem(
    CURRENT_USER_KEY
  );

  localStorage.removeItem(
    PAGE_KEY
  );
}

/* =========================================================
   REFRESH ACCESS TOKEN

   Prevent multiple simultaneous refresh requests.

   Example:
   10 API calls all receive TOKEN_EXPIRED at once.

   We perform ONE refresh instead of 10 refresh-token
   rotations racing against each other.
========================================================= */

export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken =
    getRefreshToken();

  if (!refreshToken) {
    clearAuthStorage();

    throw new Error(
      "No refresh session is available."
    );
  }

  refreshPromise =
    (async () => {
      try {
        /*
          Use the ORIGINAL browser fetch so our interceptor
          does not intercept its own /refresh request.
        */
        const response =
          await window.__clientConnectOriginalFetch(
            `${API_URL}/api/auth/refresh`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  refreshToken,
                }),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success ||
          !result.accessToken
        ) {
          clearAuthStorage();

          throw new Error(
            result.message ||
              "Your session has expired."
          );
        }

        updateTokens({
          accessToken:
            result.accessToken,

          refreshToken:
            result.refreshToken,
        });

        return result.accessToken;
      } finally {
        refreshPromise = null;
      }
    })();

  return refreshPromise;
}

/* =========================================================
   AUTHENTICATED FETCH INTERCEPTOR

   Existing project files already use normal fetch():

   fetch("/api/...", {
     headers: {
       Authorization: `Bearer ${getAuthToken()}`
     }
   })

   Rather than rewriting every module, this interceptor:

   1. lets existing requests run normally
   2. detects expired access tokens
   3. refreshes once
   4. retries the original request with the new token
========================================================= */

export function installAuthFetchInterceptor() {
  if (
    interceptorInstalled
  ) {
    return;
  }

  interceptorInstalled =
    true;

  if (
    !window.__clientConnectOriginalFetch
  ) {
    window.__clientConnectOriginalFetch =
      window.fetch.bind(window);
  }

  const originalFetch =
    window.__clientConnectOriginalFetch;

  window.fetch =
    async function authAwareFetch(
      input,
      init = {}
    ) {
      const url =
        typeof input === "string"
          ? input
          : input?.url || "";

      /*
        Never intercept authentication bootstrap endpoints.
      */
      const excluded =
        url.includes(
          "/api/auth/login"
        ) ||
        url.includes(
          "/api/auth/register-admin"
        ) ||
        url.includes(
          "/api/auth/refresh"
        ) ||
        url.includes(
          "/api/auth/logout"
        );

      const accessToken =
        getAccessToken();

      const headers =
        new Headers(
          init.headers ||
            (input instanceof Request
              ? input.headers
              : undefined)
        );

      /*
        If this is an API request and an access token exists,
        make sure the latest token is used.

        This also replaces old manually supplied tokens in
        existing components.
      */
      if (
        !excluded &&
        accessToken &&
        url.includes("/api/")
      ) {
        headers.set(
          "Authorization",
          `Bearer ${accessToken}`
        );
      }

      const requestInit = {
        ...init,
        headers,
      };

      let response =
        await originalFetch(
          input,
          requestInit
        );

      if (
        excluded ||
        response.status !== 401
      ) {
        return response;
      }

      /*
        Clone before reading JSON because response bodies can
        only be consumed once.
      */
      let errorBody = null;

      try {
        errorBody =
          await response
            .clone()
            .json();
      } catch {
        return response;
      }

      const refreshableCodes =
        new Set([
          "TOKEN_EXPIRED",
          "SESSION_EXPIRED",
        ]);

      if (
        !refreshableCodes.has(
          errorBody?.code
        )
      ) {
        /*
          Invalid/revoked/password-changed sessions must not
          automatically refresh.
        */
        const terminalCodes =
          new Set([
            "INVALID_TOKEN",
            "SESSION_NOT_FOUND",
            "SESSION_REVOKED",
            "PASSWORD_CHANGED",
            "USER_NOT_FOUND",
          ]);

        if (
          terminalCodes.has(
            errorBody?.code
          )
        ) {
          clearAuthStorage();

          window.dispatchEvent(
            new CustomEvent(
              "client-connect-auth-expired"
            )
          );
        }

        return response;
      }

      try {
        const newAccessToken =
          await refreshAccessToken();

        const retryHeaders =
          new Headers(headers);

        retryHeaders.set(
          "Authorization",
          `Bearer ${newAccessToken}`
        );

        return await originalFetch(
          input,
          {
            ...init,
            headers:
              retryHeaders,
          }
        );
      } catch {
        clearAuthStorage();

        window.dispatchEvent(
          new CustomEvent(
            "client-connect-auth-expired"
          )
        );

        return response;
      }
    };
}

/* =========================================================
   VALIDATE CURRENT SESSION
========================================================= */

export async function validateCurrentSession() {
  const accessToken =
    getAccessToken();

  const refreshToken =
    getRefreshToken();

  if (
    !accessToken &&
    !refreshToken
  ) {
    return null;
  }

  try {
    const response =
      await fetch(
        `${API_URL}/api/auth/me`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/json",
          },
        }
      );

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      clearAuthStorage();
      return null;
    }

    return result.user;
  } catch (error) {
    console.error(
      "Session validation error:",
      error
    );

    return null;
  }
}

/* =========================================================
   LOGOUT CURRENT AUTH SESSION

   This has NOTHING to do with employee End Workday.
========================================================= */

export async function logoutAuthSession() {
  const refreshToken =
    getRefreshToken();

  try {
    if (
      refreshToken &&
      window.__clientConnectOriginalFetch
    ) {
      await window.__clientConnectOriginalFetch(
        `${API_URL}/api/auth/logout`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              refreshToken,
            }),
        }
      );
    }
  } catch (error) {
    console.warn(
      "Server logout failed:",
      error
    );
  } finally {
    clearAuthStorage();
  }
}