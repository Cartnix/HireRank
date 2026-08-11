import { TokenPair } from "./types";

export const tokenStorage = {
    getAccess: () => null,
    getRefresh: () => null,
    setTokens: (_: TokenPair) => {},
    clear: () => {},
};