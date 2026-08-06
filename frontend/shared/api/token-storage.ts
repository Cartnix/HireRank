import { TokenPair } from "./types";

const ACCESS_KEY = "hireai_access_token";
const REFRESH_KEY = "hireai_refresh_token";

export const tokenStorage = {
    getAccess: () =>
        typeof window != "undefined" ? localStorage.getItem(ACCESS_KEY) : null,
    getRefresh: () =>
        typeof window != "undefined" ? localStorage.getItem(REFRESH_KEY) : null,

    setTokens: (pair: TokenPair) => {
        if (typeof window != "undefined") {
            localStorage.setItem(ACCESS_KEY, pair.access_token);
            localStorage.setItem(REFRESH_KEY, pair.refresh_token)
        }
    },

    clear: () => {
        if (typeof window != "undefined") {
            localStorage.removeItem(ACCESS_KEY)
            localStorage.removeItem(REFRESH_KEY)
        }
    }
}