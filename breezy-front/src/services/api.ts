import axios, { AxiosHeaders } from "axios";
import { DEFAULT_API_URL } from "../config";

export const API_TOKEN_STORAGE_KEY = "breezy_jwt";

export const api = axios.create({
  baseURL: DEFAULT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setApiBaseUrl(apiUrl?: string) {
  api.defaults.baseURL = apiUrl?.trim() || DEFAULT_API_URL;
}

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = window.localStorage.getItem(API_TOKEN_STORAGE_KEY);

  if (token) {
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});
