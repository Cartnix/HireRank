import "server-only";
import { cookies } from "next/headers";
import { getApiV1Url } from "@/shared/config/env";
import { ApiError } from "./client";

type ServerApiFetchOptions = Omit<RequestInit, "credentials"> & {
  json?: unknown;
};

export async function serverApiFetch<T = unknown>(
  path: string,
  options: ServerApiFetchOptions = {},
): Promise<T> {
  const { json, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const cookieStore = await cookies();
  headers.set("Cookie", cookieStore.toString());

  try {
    const res = await fetch(`${getApiV1Url()}${path}`, {
      ...rest,
      headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });

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