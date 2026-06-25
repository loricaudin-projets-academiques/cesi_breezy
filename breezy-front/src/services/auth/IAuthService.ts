/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../../types';

export interface IAuthService {
  isLoggedIn(): boolean;
  getApiUrl(): string;
  getCurrentUser(): UserProfile;
  fetchCurrentUser(): Promise<UserProfile>;
  saveCurrentUser(user: UserProfile): void;
  login(username: string, passkey: string, apiUrl: string): Promise<UserProfile>;
  register(name: string, email: string, username: string, passkey: string, apiUrl: string): Promise<UserProfile>;
  logout(): void;
}
