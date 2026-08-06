import { apiFetch } from "@/shared/api/client";
import { getApiV1Url } from "@/shared/config/env";
import type { ConsentPayload } from "@/features/auth/model/FormSchema";

export type UserPublic = {
  id: string;
  email: string;
  role: string;
  tenant_id: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active: boolean;
  legal_policy_version?: string | null;
  legal_accepted_at?: string | null;
  legal_acceptance_required?: boolean;
  consent_refresh_required?: boolean;
  current_legal_policy_version?: string;
};

export type AuthSession = {
  token_type: string;
  expires_in: number;
};

export type RegisterPayload = {
  email: string;
  password: string;
  role: "candidate" | "hr" | "manager" | "recruiter";
  first_name?: string;
  last_name?: string;
  consent: ConsentPayload;
};

export async function login(email: string, password: string): Promise<AuthSession> {
  return apiFetch<AuthSession>("/auth/login", {
    method: "POST",
    json: { email, password },
    skipCsrf: true,
  });
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  return apiFetch<AuthSession>("/auth/register", {
    method: "POST",
    json: payload,
    skipCsrf: true,
  });
}

export async function logout(): Promise<void> {
  await apiFetch<void>("/auth/logout", { method: "POST" });
}

export async function me(): Promise<UserPublic> {
  return apiFetch<UserPublic>("/auth/me");
}

export async function refresh(): Promise<AuthSession> {
  return apiFetch<AuthSession>("/auth/refresh", { method: "POST" });
}

export async function forgetMe(): Promise<void> {
  await apiFetch<void>("/auth/forget-me", { method: "POST" });
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

/** POST start with consent → follow redirect to IdP (RK §1.4). */
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
  // Some browsers hide Location on opaque redirects — fall back to reading JSON error
  let detail = "OAuth start failed";
  try {
    const data = (await res.json()) as { detail?: string };
    if (data.detail) detail = data.detail;
  } catch {
    /* ignore */
  }
  throw new Error(detail);
}
