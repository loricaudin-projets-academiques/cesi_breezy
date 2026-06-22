/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IAuthService } from './IAuthService';
import { IStorageProvider } from '../storage/IStorageProvider';
import { UserProfile } from '../../types';
import { INITIAL_USER } from '../../mockData';
import { DEFAULT_API_URL } from '../../config';
import { normalizeUsername } from '../../utils/username';

// Clés de stockage propres à l'authentification — personne d'autre ne les connaît
const KEYS = {
  isLoggedIn: 'breezy_is_logged_in',
  apiUrl: 'breezy_api_url',
  currentUser: 'breezy_user',
  accounts: 'breezy_registered_users',
} as const;

// Un compte enregistré = un profil + l'empreinte (hash) de son mot de passe.
// Détail de persistance interne au service — il ne sort jamais d'ici.
interface RegisteredAccount extends UserProfile {
  passkeyHash: string;
}

// Service d'authentification qui fonctionne entièrement en local
// Utile tant qu'on n'a pas de vrai back-end connecté
export class MockAuthService implements IAuthService {
  constructor(private storage: IStorageProvider) {
    this.purgeLegacyTestData();
  }

  // Migration propre : si on trouve un vieil utilisateur de test, on repart de zéro
  private purgeLegacyTestData(): void {
    const savedUser = this.storage.get<UserProfile>(KEYS.currentUser);
    if (savedUser?.username?.includes('@janedoe')) {
      this.storage.clear();
    }
  }

  // Vérifie si quelqu'un est actuellement connecté
  isLoggedIn(): boolean {
    return this.storage.get<boolean>(KEYS.isLoggedIn) === true;
  }

  // Récupère l'adresse de l'API qu'on a configurée lors de la connexion
  getApiUrl(): string {
    return this.storage.get<string>(KEYS.apiUrl) || DEFAULT_API_URL;
  }

  // Renvoie le profil de l'utilisateur actuellement connecté
  getCurrentUser(): UserProfile {
    const user = this.storage.get<UserProfile>(KEYS.currentUser);
    return user || INITIAL_USER;
  }

  async fetchCurrentUser(): Promise<UserProfile> {
    return this.getCurrentUser();
  }

  // Met à jour les infos du profil dans le stockage local
  saveCurrentUser(user: UserProfile): void {
    this.storage.set<UserProfile>(KEYS.currentUser, user);
  }

  // Tente de connecter un utilisateur existant
  async login(username: string, passkey: string, apiUrl: string): Promise<UserProfile> {
    this.assertCredentials(username, passkey);

    const cleanUsername = normalizeUsername(username);
    const existing = this.findAccount(cleanUsername);

    // Compte inconnu
    if (!existing) {
      throw new Error("Nom d'utilisateur inconnu. Créez un compte d'abord.");
    }

    // Mauvais mot de passe — on compare les empreintes, jamais le mot de passe en clair
    const passkeyHash = await hashPasskey(passkey);
    if (existing.passkeyHash !== passkeyHash) {
      throw new Error("Mot de passe incorrect.");
    }

    const loggedUser = toProfile(existing);
    this.startSession(loggedUser, apiUrl);
    return loggedUser;
  }

  // Crée un nouveau compte et connecte directement l'utilisateur
  async register(name: string, username: string, email: string, passkey: string, apiUrl: string): Promise<UserProfile> {
    if (!name.trim()) {
      throw new Error("Le nom complet est requis.");
    }
    if (!email.trim()) {
      throw new Error("L'adresse email est requise.");
    }
    this.assertCredentials(username, passkey);

    const cleanUsername = normalizeUsername(username);

    // On refuse si le pseudo est déjà utilisé
    if (this.findAccount(cleanUsername)) {
      throw new Error("Ce nom d'utilisateur est déjà pris.");
    }

    const newAccount: RegisteredAccount = {
      ...INITIAL_USER,
      name: name.trim(),
      username: cleanUsername,
      passkeyHash: await hashPasskey(passkey),
    };

    // On ajoute le nouveau compte à la liste
    this.saveRegisteredAccounts([...this.getRegisteredAccounts(), newAccount]);

    const loggedUser = toProfile(newAccount);
    this.startSession(loggedUser, apiUrl);
    return loggedUser;
  }

  // Déconnexion — on supprime uniquement les données de session.
  // Chaque autre service (feed, conversations) est responsable de nettoyer les siennes.
  logout(): void {
    this.storage.remove(KEYS.isLoggedIn);
    this.storage.remove(KEYS.apiUrl);
    this.storage.remove(KEYS.currentUser);
  }

  // Validation commune à la connexion et à l'inscription
  private assertCredentials(username: string, passkey: string): void {
    if (!username.trim()) {
      throw new Error("Le nom d'utilisateur est requis.");
    }
    if (!passkey) {
      throw new Error("Le mot de passe est requis.");
    }
  }

  // Cherche un compte par pseudo, sans tenir compte de la casse
  private findAccount(cleanUsername: string): RegisteredAccount | undefined {
    return this.getRegisteredAccounts().find(
      (account) => account.username.toLowerCase() === cleanUsername.toLowerCase()
    );
  }

  // Liste de tous les comptes enregistrés dans le navigateur
  private getRegisteredAccounts(): RegisteredAccount[] {
    return this.storage.get<RegisteredAccount[]>(KEYS.accounts) || [];
  }

  // Sauvegarde la liste complète des comptes
  private saveRegisteredAccounts(accounts: RegisteredAccount[]): void {
    this.storage.set<RegisteredAccount[]>(KEYS.accounts, accounts);
  }

  // Marque la session comme active et sauvegarde le profil connecté
  private startSession(user: UserProfile, apiUrl: string): void {
    this.storage.set<boolean>(KEYS.isLoggedIn, true);
    this.storage.set<string>(KEYS.apiUrl, apiUrl.trim() || DEFAULT_API_URL);
    this.saveCurrentUser(user);
  }
}

// Convertit un compte stocké en profil public — l'empreinte du mot de passe reste ici
function toProfile(account: RegisteredAccount): UserProfile {
  const { passkeyHash: _passkeyHash, ...profile } = account;
  return profile;
}

// Empreinte SHA-256 du mot de passe : on ne stocke jamais le mot de passe en clair
async function hashPasskey(passkey: string): Promise<string> {
  const data = new TextEncoder().encode(passkey);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
