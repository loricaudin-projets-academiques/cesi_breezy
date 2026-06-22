import { DEFAULT_API_URL } from "../config";

export function getMediaUrl(value?: string): string {
  if (!value) return "";
  if (value.startsWith("data:") || value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/uploads/")) {
    const apiRoot = DEFAULT_API_URL.replace(/\/api\/?$/, "");
    return `${apiRoot}${value}`;
  }

  return value;
}
