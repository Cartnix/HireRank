import { tokenStorage } from "./token-storage";
import { ApiError, TokenPair } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

let refreshPromise: Promise<TokenPair | null> | null = null;

async function refreshTokens(): Promise<TokenPair | null> {
    const refresh = tokenStorage.getRefresh();
    if (!refresh) return null

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
    })

    if (!res.ok) {
        tokenStorage.clear();
        return null
    }

    const pair: TokenPair = await res.json();
    tokenStorage.setTokens(pair);
    return pair;
}

type RequestOptions = RequestInit & {
    auth?: boolean;
};

export async function apiClient<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const { auth = true, headers, ...rest } = options;

    const doFeatch = async (token?: string | null) => {
        return fetch(`${BASE_URL}${path}`, {
            ...rest,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            }
        })
    }

    let access = auth ? tokenStorage.getAccess() : null;
    let res = await doFeatch(access)

    //401 Refreshп

    if (res.status === 401 && auth) {
        refreshPromise ??= refreshTokens().finally(() => {
            refreshPromise = null;
        });

        const pair = await refreshPromise;

        if (!pair) {
            if (typeof window != "undefined") {
                window.location.href = "/auth";
            }
            throw new Error("Unauthorized")
        }

        res = await doFeatch(pair.access_token)
    }

    if (!res.ok) {
        const err: ApiError = await res.json().catch(() => ({ datail: res.status }));
        throw new Error(typeof err.detail === "string" ? err.detail : "Request failed");
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>

}