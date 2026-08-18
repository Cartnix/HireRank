import { create } from "zustand";
import { UserPublic } from "./auth";
import { tokenStorage } from "./token-storage";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  user: UserPublic | null;
  status: AuthStatus;
};

type AuthActions = {
  setUser: (user: UserPublic) => void;
  setLoading: () => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  status: "idle",

  setUser: (user) => set({ user, status: "authenticated" }),

  setLoading: () => set({ status: "loading" }),

  clear: () => {
    tokenStorage.clear();
    set({ user: null, status: "unauthenticated" });
  },
}));

export const useCurrentUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () =>
  useAuthStore((s) => s.status === "authenticated");