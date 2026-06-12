/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IConversationService } from './IConversationService';
import { IStorageProvider } from '../storage/IStorageProvider';
import { IAuthService } from '../auth/IAuthService';
import { Conversation } from '../../types';
import { INITIAL_CONVERSATIONS } from '../../mockData';
import { normalizeUsername } from '../../utils/username';

// Clé de stockage propre à la messagerie — encapsulée dans ce service
const CONVERSATIONS_KEY = 'breezy_conversations';

// Version locale du service de messagerie — stocke tout dans le navigateur
// Parfait pour le développement, à remplacer par une vraie API plus tard
export class MockConversationService implements IConversationService {
  constructor(
    private storage: IStorageProvider,
    private auth: IAuthService
  ) {}

  // Charge les conversations depuis la mémoire du navigateur
  getConversations(): Conversation[] {
    return this.storage.get<Conversation[]>(CONVERSATIONS_KEY) || INITIAL_CONVERSATIONS;
  }

  // Enregistre les conversations pour ne pas les perdre au rechargement
  saveConversations(conversations: Conversation[]): void {
    this.storage.set<Conversation[]>(CONVERSATIONS_KEY, conversations);
  }

  // Fabrique une nouvelle conversation prête à l'emploi
  createConversation(name: string, username: string, avatar?: string): Conversation {
    return {
      id: `conv-${Date.now()}`,
      name: name.trim(),
      username: normalizeUsername(username),
      avatar: avatar?.trim() || "",
      lastMessage: "Conversation démarrée",
      unreadCount: 0,
      time: "À l'instant",
      // Présence simulée tant qu'il n'y a pas de back-end
      online: Math.random() > 0.5,
      messages: []
    };
  }

  // Essaie d'appeler l'API, et tombe sur des réponses locales si elle est inaccessible
  async fetchReply(message: string, contact: Pick<Conversation, 'name' | 'username'>): Promise<string> {
    const currentUser = this.auth.getCurrentUser();

    try {
      const res = await fetch(`${this.auth.getApiUrl()}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          username: currentUser.username,
          contactName: contact.name,
          contactUsername: contact.username
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) return data.reply;
      }
    } catch {
      // L'API est hors ligne — on utilise les réponses de secours ci-dessous
    }

    // Réponses automatiques basiques si pas de back-end disponible
    const lowercase = message.toLowerCase();
    if (lowercase.includes("salut") || lowercase.includes("hello") || lowercase.includes("hey")) {
      return `Salut ${currentUser.name} ! Comment tu vas ?`;
    }
    if (lowercase.includes("pourquoi") || lowercase.includes("comment")) {
      return `Bonne question sur "${message}". Laisse-moi réfléchir...`;
    }
    return `Reçu : "${message}". Je te réponds dès que possible !`;
  }

  // Efface toutes les conversations — utilisé à la déconnexion
  clearData(): void {
    this.storage.remove(CONVERSATIONS_KEY);
  }
}
