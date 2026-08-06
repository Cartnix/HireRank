import { apiFetch } from "@/shared/api/client";
import { getApiV1Url } from "@/shared/config/env";

export type UserPublic = {
  id: string;
  email: string;
  role: string;
  tenant_id: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active: boolean;
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

export function oauthStartUrl(provider: "google" | "linkedin"): string {
  return `${getApiV1Url()}/auth/oauth/${provider}/start`;
}
