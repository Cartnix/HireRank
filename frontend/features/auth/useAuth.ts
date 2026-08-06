"use client";

import { useState } from "react";
import * as authApi from "@/shared/api/auth";
import type { RegisterPayload } from "@/shared/api/auth";
import { ApiError } from "@/shared/api/client";

export const useAuth = () => {
  const [isLoading, setLoading] = useState(false);

  const signUp = async (payload: RegisterPayload) => {
    setLoading(true);
    try {
      const data = await authApi.register(payload);
      return { data, error: null as null };
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Registration failed";
      return { data: null, error: { message } };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      return { data, error: null as null };
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Login failed";
      return { data: null, error: { message } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authApi.logout();
      return { error: null as null };
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : "Logout failed";
      return { error: { message } };
    } finally {
      setLoading(false);
    }
  };

  return { signIn, signUp, signOut, isLoading };
};
