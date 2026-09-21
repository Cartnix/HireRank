import { useState } from "react";
import { login, logout, register } from "@/shared/api/auth";
import type { RegisterPayload } from "@/shared/api/auth";

export const useAuth = () => {
  const [isLoading, setLoading] = useState(false);

  const signUp = async (payload: RegisterPayload) => {
    setLoading(true);
    try {
      const data = await register(payload);
      return { data, error: null } as const;
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error("Auth failed") } as const;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await login(email, password);
      return { data, error: null } as const;
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error("Auth failed") } as const;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await logout();
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Logout failed";
    } finally {
      setLoading(false);
    }
  };

  return { signIn, signUp, signOut, isLoading };
};
