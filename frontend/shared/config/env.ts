export function getApiBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
  if (configuredUrl === undefined) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  return configuredUrl.replace(/\/$/, "");
}

export function getApiV1Url(): string {
  const baseUrl = getApiBaseUrl();
  if (baseUrl) return `${baseUrl}/api/v1`;
  if (typeof window !== "undefined") return "/api/v1";

  const proxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, "");
  if (!proxyTarget) {
    throw new Error("API_PROXY_TARGET is required for server-side API requests");
  }
  return `${proxyTarget}/api/v1`;
}
