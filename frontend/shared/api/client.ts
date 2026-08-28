import { getApiV1Url } from "@/shared/config/env";
import { tokenStorage } from "@/shared/api/token-storage";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`,
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function getCsrfToken(): string | null {
  return readCookie("csrf_token");
}

type ApiFetchOptions = Omit<RequestInit, "credentials"> & {
  json?: unknown;
  skipCsrf?: boolean;
  auth?: boolean;
  _retried?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshToken = tokenStorage.getRefresh();
        if (!refreshToken) return false;

        const res = await fetch(`${getApiV1Url()}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          tokenStorage.clear();
          return false;
        }

        const data = await res.json();
        if (!data?.access_token || !data?.refresh_token) {
          tokenStorage.clear();
          return false;
        }

        tokenStorage.setTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_type: data.token_type ?? "bearer",
          expires_id: Number(data.expires_in ?? 0),
        });

        return true;
      } catch {
        tokenStorage.clear();
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const {
    json,
    skipCsrf,
    auth = true,
    headers: initHeaders,
    _retried,
    ...rest
  } = options;
  const headers = new Headers(initHeaders);

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (auth && !headers.has("Authorization")) {
    const accessToken = tokenStorage.getAccess();
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  const method = (rest.method ?? "GET").toUpperCase();
  if (!skipCsrf && !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    const csrf = getCsrfToken();
    if (csrf) {
      headers.set("X-CSRF-Token", csrf);
    }
  }

  try {
    const res = await fetch(`${getApiV1Url()}${path}`, {
      ...rest,
      headers,
      credentials: "include",
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });


    if (
      res.status === 401 &&
      auth &&
      !_retried &&
      path !== "/auth/refresh" &&
      path !== "/auth/login"
    ) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiFetch<T>(path, { ...options, _retried: true });
      }
    }

    if (res.status === 204) {
      return undefined as T;
    }

    const contentType = res.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
      ? await res.json()
      : await res.text();

    if (!res.ok) {
      const detail =
        typeof data === "object" && data && "detail" in data
          ? String((data as { detail: unknown }).detail)
          : typeof data === "string"
            ? data
            : res.statusText;
      throw new ApiError(res.status, detail);
    }

    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const message =
      err instanceof Error ? err.message : "Network request failed";
    throw new ApiError(0, message);
  }
}

export const apiClient = apiFetch;