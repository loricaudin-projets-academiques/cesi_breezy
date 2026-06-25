import { api, authApi, API_TOKEN_STORAGE_KEY, setApiBaseUrl, setAuthBaseUrl } from "../api";
import { IAuthService } from "./IAuthService";
import { IStorageProvider } from "../storage/IStorageProvider";
import { UserProfile } from "../../types";
import { INITIAL_USER } from "../../mockData";
import { DEFAULT_API_URL } from "../../config";

const KEYS = {
  isLoggedIn: "breezy_is_logged_in",
  apiUrl: "breezy_api_url",
  currentUser: "breezy_user",
} as const;

interface AuthResponse {
  user: UserProfile;
  token: string;
}

export class HttpAuthService implements IAuthService {
  constructor(private storage: IStorageProvider) {}

  isLoggedIn(): boolean {
    return this.storage.get<boolean>(KEYS.isLoggedIn) === true;
  }

  getApiUrl(): string {
    return this.storage.get<string>(KEYS.apiUrl) || DEFAULT_API_URL;
  }

  getCurrentUser(): UserProfile {
    return this.storage.get<UserProfile>(KEYS.currentUser) || INITIAL_USER;
  }

  async fetchCurrentUser(): Promise<UserProfile> {
    setApiBaseUrl(this.getApiUrl());
    const { data } = await api.get<UserProfile>("/users/me");
    this.saveCurrentUser(data);
    return data;
  }

  saveCurrentUser(user: UserProfile): void {
    this.storage.set<UserProfile>(KEYS.currentUser, user);
  }

  async login(username: string, passkey: string, apiUrl: string): Promise<UserProfile> {
    setAuthBaseUrl(apiUrl);
    const { data } = await authApi.post<AuthResponse>("/auth/login", {
      username,
      password: passkey,
    });

    this.startSession(data.user, data.token, apiUrl);
    return data.user;
  }

  async register(name: string, email: string, username: string, passkey: string, apiUrl: string): Promise<UserProfile> {
    setAuthBaseUrl(apiUrl);
    const { data } = await authApi.post<AuthResponse>("/auth/register", {
      name,
      email,
      username,
      password: passkey,
    });

    this.startSession(data.user, data.token, apiUrl);
    return data.user;
  }

  logout(): void {
    this.storage.remove(KEYS.isLoggedIn);
    this.storage.remove(KEYS.apiUrl);
    this.storage.remove(KEYS.currentUser);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(API_TOKEN_STORAGE_KEY);
    }
  }

  private startSession(user: UserProfile, token: string, apiUrl: string): void {
    setApiBaseUrl(apiUrl);
    setAuthBaseUrl(apiUrl);
    this.storage.set<boolean>(KEYS.isLoggedIn, true);
    this.storage.set<string>(KEYS.apiUrl, apiUrl.trim() || DEFAULT_API_URL);
    this.saveCurrentUser(user);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(API_TOKEN_STORAGE_KEY, token);
    }
  }
}
