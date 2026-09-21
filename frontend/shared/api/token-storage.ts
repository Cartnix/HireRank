import { TokenPair } from "./types";

const ACCESS_TOKEN_KEY = "hirerank_access_token";
const REFRESH_TOKEN_KEY = "hirerank_refresh_token";

let accessToken: string | null = null;
let refreshToken: string | null = null;

function readStorageValue(key: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(key: string, value: string | null): void {
  if (typeof window === "undefined") return;

  try {
    if (value === null) {
      window.localStorage.removeItem(key);
      return;
    }

    window.localStorage.setItem(key, value);
  } catch {
   
  }
}

export const tokenStorage = {
  getAccess: (): string | null => {
    if (accessToken === null) {
      accessToken = readStorageValue(ACCESS_TOKEN_KEY);
    }
    return accessToken;
  },
  getRefresh: (): string | null => {
    if (refreshToken === null) {
      refreshToken = readStorageValue(REFRESH_TOKEN_KEY);
    }
    return refreshToken;
  },
  setTokens: (tokens: TokenPair): void => {
    accessToken = tokens.access_token;
    refreshToken = tokens.refresh_token;

    writeStorageValue(ACCESS_TOKEN_KEY, accessToken);
    writeStorageValue(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: (): void => {
    accessToken = null;
    refreshToken = null;

    writeStorageValue(ACCESS_TOKEN_KEY, null);
    writeStorageValue(REFRESH_TOKEN_KEY, null);
  },
};
