/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../../types';

// Contrat que doit respecter n'importe quel service d'authentification.
// Que ce soit le mock local ou une vraie API, les méthodes restent les mêmes.
// login/register sont asynchrones : une vraie API le sera forcément,
// et le mock local en a aussi besoin pour hacher le mot de passe.
export interface IAuthService {
  isLoggedIn(): boolean;
  getApiUrl(): string;
  getCurrentUser(): UserProfile;
  fetchCurrentUser(): Promise<UserProfile>;
  saveCurrentUser(user: UserProfile): void;
  login(username: string, passkey: string, apiUrl: string): Promise<UserProfile>;
  register(name: string, username: string, passkey: string, apiUrl: string): Promise<UserProfile>;
  logout(): void;
}
