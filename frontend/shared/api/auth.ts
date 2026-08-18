import { apiFetch } from "@/shared/api/client";
import { tokenStorage } from "@/shared/api/token-storage";
import type { components } from "@/shared/api/schema";
import { getApiV1Url } from "@/shared/config/env";
import type { ConsentPayload } from "@/features/auth/model/FormSchema";

export type UserPublic = components["schemas"]["User"];
export type AuthSession = components["schemas"]["AuthSession"];
export type RegisterPayload = components["schemas"]["RegisterRequest"];

type TokenPayloadLike = Partial<AuthSession> & {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
};

function persistSession(session: TokenPayloadLike | null | undefined): void {
  if (!session) return;

  const accessToken = session.access_token;
  const refreshToken = session.refresh_token;

  if (!accessToken || !refreshToken) {
    return;
  }

  tokenStorage.setTokens({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: session.token_type ?? "bearer",
    expires_id: Number(session.expires_in ?? 0),
  });
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const data = await apiFetch<AuthSession>("/auth/login", {
    method: "POST",
    json: { email, password },
    skipCsrf: true,
  });

  persistSession(data);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  const data = await apiFetch<AuthSession>("/auth/register", {
    method: "POST",
    json: payload,
    skipCsrf: true,
  });

  persistSession(data);
  await me();
  return data;
}

export async function logout(): Promise<void> {
  await apiFetch<void>("/auth/logout", { method: "POST" });
  tokenStorage.clear();
}

export async function me(): Promise<UserPublic> {
  return apiFetch<UserPublic>("/auth/me");
}

export async function refresh(): Promise<AuthSession> {
  const data = await apiFetch<AuthSession>("/auth/refresh", { method: "POST" });
  persistSession(data);
  return data;
}

export async function forgetMe(): Promise<void> {
  await apiFetch<void>("/auth/forget-me", { method: "POST" });
  tokenStorage.clear();
}

export async function checkEmail(
  email: string,
): Promise<{ registered: boolean }> {
  return apiFetch<{ registered: boolean }>("/auth/check-email", {
    method: "POST",
    json: { email },
    skipCsrf: true,
  });
}

export async function acceptLegal(
  consent?: ConsentPayload,
): Promise<UserPublic> {
  return apiFetch<UserPublic>("/auth/accept-legal", {
    method: "POST",
    json: consent ? { consent } : {},
  });
}

export async function startOAuth(
  provider: "google" | "linkedin",
  consent: ConsentPayload,
): Promise<void> {
  const res = await fetch(`${getApiV1Url()}/auth/oauth/${provider}/start`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consent }),
    redirect: "manual",
  });
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("Location");
    if (loc) {
      window.location.assign(loc);
      return;
    }
  }

  let detail = "OAuth start failed";
  try {
    const data = (await res.json()) as { detail?: string };
    if (data.detail) detail = data.detail;
  } catch {
    /* ignore */
  }
  throw new Error(detail);
}
