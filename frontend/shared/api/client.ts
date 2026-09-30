import { getApiV1Url } from "@/shared/config/env";

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
  _retried?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;
let previewRole: string | null = null;
let developmentMode = false;
export function setApiDevelopmentMode(enabled: boolean) { developmentMode = enabled; }
export function setApiPreviewRole(role: string | null) { previewRole = role; }

function errorDetail(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(item => {
    if (item && typeof item === "object" && "msg" in item) {
      const location = "loc" in item && Array.isArray(item.loc) ? item.loc.join(".") : "";
      return `${location ? `${location}: ` : ""}${String(item.msg)}`;
    }
    return errorDetail(item);
  }).join("; ");
  return value == null ? "Ошибка запроса" : JSON.stringify(value);
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        await apiFetch("/auth/refresh", { method: "POST" });
        return true;
      } catch {
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
  if (developmentMode && /^\/(candidates|vacancies|users|interviews|copilot)(\/|$)/.test(path)) {
    throw new ApiError(403, "Dev mode: запрос к рабочей БД заблокирован. Используйте тестовый dataset.");
  }
  const { json, skipCsrf, headers: initHeaders, _retried, ...rest } = options;
  const headers = new Headers(initHeaders);
  if (previewRole && !/^\/(auth|login|developer)(\/|$)/.test(path)) headers.set("X-Preview-Role", previewRole);

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
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
      !_retried &&
      getCsrfToken() &&
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
          ? errorDetail((data as { detail: unknown }).detail)
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
