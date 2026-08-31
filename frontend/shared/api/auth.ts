import { apiFetch } from "@/shared/api/client";
import type { components } from "@/shared/api/schema";
import type { ConsentPayload } from "@/features/auth/model/FormSchema";
import { useAuthStore } from "./auth-store";
import { User } from "@/entities/user/model/types";

export type UserPublic = components["schemas"]["User"];
export type AuthSession = components["schemas"]["AuthSession"];
export type RegisterPayload = components["schemas"]["RegisterRequest"];

export interface UpdateMePayload {
  first_name?: string;
  last_name?: string;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthSession> {
  useAuthStore.getState().setLoading();

  const data = await apiFetch<AuthSession>("/auth/login", {
    method: "POST",
    json: { email, password },
    skipCsrf: true,
  });

  await me();
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  useAuthStore.getState().setLoading();

  const data = await apiFetch<AuthSession>("/auth/register", {
    method: "POST",
    json: payload,
    skipCsrf: true,
  });

  await me();
  return data;
}

export async function logout(): Promise<void> {
  await apiFetch<void>("/auth/logout", { method: "POST" });
  useAuthStore.getState().clear();
}

export async function me(): Promise<UserPublic> {
  const user = await apiFetch<UserPublic>("/auth/me");
  useAuthStore.getState().setUser(user);
  return user;
}

export async function refresh(): Promise<AuthSession> {
  return apiFetch<AuthSession>("/auth/refresh", { method: "POST" });
}

export async function forgetMe(): Promise<void> {
  await apiFetch<void>("/auth/forget-me", { method: "POST" });
  useAuthStore.getState().clear();
}

export async function updateMe(payload: UpdateMePayload) {
  await apiFetch<User>("/auth/me", {
    method: "PATCH",
    json: payload,
  });
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
  const user = await apiFetch<UserPublic>("/auth/accept-legal", {
    method: "POST",
    json: consent ? { consent } : {},
  });
  useAuthStore.getState().setUser(user);
  return user;
}
