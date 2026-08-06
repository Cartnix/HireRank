import { User } from "@/entities/user/model/types";
import { authApi, RegisterPayload } from "./auth-api";
import { create } from "zustand";
import { tokenStorage } from "@/shared/api/token-storage";

type AuthState = {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    logout: () => Promise<void>;
    bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    bootstrap: async () => {
        const token = tokenStorage.getAccess();
        if (!token) {
            set({ isLoading: false, user: null, isAuthenticated: false });
            return;
        }

        try {
            const user = await authApi.me();
            set({ user, isLoading: false, isAuthenticated: true });
        } catch {
            tokenStorage.clear();
            set({ user: null, isLoading: false, isAuthenticated: false });
        }
    },

    login: async (email, password) => {
        await authApi.login({ email, password });
        const user = await authApi.me();
        set({ user, isAuthenticated: true });
    },

    register: async (payload) => {
        await authApi.register(payload)
        const user = await authApi.me();
        set({ user, isAuthenticated: true });
    },

    logout: async () => {
        await authApi.logout();
        set({ user: null, isAuthenticated: false });
    },
}))