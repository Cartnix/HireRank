import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiV1Url } from "@/shared/config/env";
import { ApiError } from "./client";

async function refreshAndGetCookie(): Promise<string | null> {
  const cookieStore = await cookies();

  const res = await fetch(`${getApiV1Url()}/auth/refresh`, {
    method: "POST",
    headers: { Cookie: cookieStore.toString() },
  });
  if (!res.ok) return null;

  const setCookie =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];
  if (setCookie.length === 0) return null;

  const merged = new Map(cookieStore.getAll().map((c) => [c.name, c.value]));
  for (const raw of setCookie) {
    const [nv] = raw.split(";");
    const eq = nv.indexOf("=");
    const name = nv.slice(0, eq).trim();
    const value = decodeURIComponent(nv.slice(eq + 1));
    merged.set(name, value);
    try {
      cookieStore.set(name, value); // сработает в Route Handler/Server Action
    } catch {}
  }

  return Array.from(merged.entries())
    .map(([n, v]) => `${n}=${v}`)
    .join("; ");
}

export async function serverApiFetch<T = unknown>(
  path: string,
  options: Omit<RequestInit, "credentials"> & { json?: unknown } = {},
  _retried = false,
): Promise<T> {
  const { json, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  if (json !== undefined) headers.set("Content-Type", "application/json");

  const cookieStore = await cookies();
  if (!headers.has("Cookie")) headers.set("Cookie", cookieStore.toString());

  const res = await fetch(`${getApiV1Url()}${path}`, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (res.status === 401 && !_retried) {
    const freshCookie = await refreshAndGetCookie();
    if (freshCookie) {
      const retryHeaders = new Headers(headers);
      retryHeaders.set("Cookie", freshCookie);
      return serverApiFetch<T>(path, { ...options, headers: retryHeaders }, true);
    }
    redirect("/login");
  }

  if (res.status === 204) return undefined as T;

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
}