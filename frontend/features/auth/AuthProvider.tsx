"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "@/shared/api/auth";
import type { UserPublic } from "@/shared/api/auth";
import { ApiError } from "@/shared/api/client";

type AuthContextValue = {
  user: UserPublic | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadSession(): Promise<UserPublic | null> {
  try {
    return await authApi.me();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return null;
    }
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    const current = await loadSession();
    setUser(current);
    setIsLoading(false);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadSession().then((current) => {
      if (cancelled) return;
      setUser(current);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshSession, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthSession() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthSession must be used within AuthProvider");
  }
  return ctx;
}
