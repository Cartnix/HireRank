import { User } from "@/entities/user/model/types";
import { apiClient } from "@/shared/api/client";
import { tokenStorage } from "@/shared/api/token-storage";
import { TokenPair } from "@/shared/api/types";

export type RegisterPayload = {
    email: string,
    password: string,
    role: "hr" | "candidate",
    first_name: string,
    last_name: string;
};

export type LoginPayload = {
    email: string,
    password: string;
};

export const authApi = {
    register: async (body: RegisterPayload) => {
        const pair = await apiClient<TokenPair>("/auth/register", {
            method: "POST",
            body: JSON.stringify(body),
            auth: false,
        });
        tokenStorage.setTokens(pair);
        return pair
    },

    login: async (body: LoginPayload) => {
        const pair = await apiClient<TokenPair>("/auth/login", {
            method: "POST",
            body: JSON.stringify(body),
            auth: false,
        });
        tokenStorage.setTokens(pair);
        return pair;
    },

    me: () => apiClient<User>("/auth/me"),

    logout: async () => {
        const refresh = tokenStorage.getRefresh();
        if (refresh) {
            await apiClient<void>("/auth/logout", {
                method: "POST",
                body: JSON.stringify({ refresh_token: refresh })
            }).catch(() => { });
        }
        tokenStorage.clear()
    }
}