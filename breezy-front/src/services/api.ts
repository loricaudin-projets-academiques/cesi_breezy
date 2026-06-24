import axios, { AxiosHeaders, InternalAxiosRequestConfig } from "axios";
import { DEFAULT_API_URL } from "../config";

export const API_TOKEN_STORAGE_KEY = "breezy_jwt";

export const api = axios.create({
  baseURL: DEFAULT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authApi = axios.create({
  baseURL: DEFAULT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setApiBaseUrl(apiUrl?: string) {
  api.defaults.baseURL = apiUrl?.trim() || DEFAULT_API_URL;
}

export function setAuthBaseUrl(apiUrl?: string) {
  authApi.defaults.baseURL = apiUrl?.trim() || DEFAULT_API_URL;
}

function attachAuthToken(config: InternalAxiosRequestConfig) {
  if (typeof window === "undefined") {
    return config;
  }

  const token = window.localStorage.getItem(API_TOKEN_STORAGE_KEY);

  if (token) {
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
}

api.interceptors.request.use(attachAuthToken);
authApi.interceptors.request.use(attachAuthToken);

// Déconnexion automatique si le backend répond 401 (JWT expiré ou invalide)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem(API_TOKEN_STORAGE_KEY);
      window.dispatchEvent(new Event("breezy:unauthorized"));
    }
    return Promise.reject(error);
  }
);
