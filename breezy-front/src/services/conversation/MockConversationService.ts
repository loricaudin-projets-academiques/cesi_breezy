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

const CONVERSATIONS_KEY = 'breezy_conversations';

export class MockConversationService implements IConversationService {
  constructor(
    private storage: IStorageProvider,
    private auth: IAuthService
  ) {}

  getConversations(): Conversation[] {
    return this.storage.get<Conversation[]>(CONVERSATIONS_KEY) || INITIAL_CONVERSATIONS;
  }

  saveConversations(conversations: Conversation[]): void {
    this.storage.set<Conversation[]>(CONVERSATIONS_KEY, conversations);
  }

  createConversation(name: string, username: string, avatar?: string): Conversation {
    return {
      id: `conv-${Date.now()}`,
      name: name.trim(),
      username: normalizeUsername(username),
      avatar: avatar?.trim() || "",
      lastMessage: "Conversation demarree",
      unreadCount: 0,
      time: "A l'instant",
      online: Math.random() > 0.5,
      messages: [],
    };
  }

  async fetchConversations(): Promise<Conversation[]> {
    return this.getConversations();
  }

  async createRemoteConversation(payload: { name: string; username: string; avatar?: string }): Promise<Conversation> {
    const conversation = this.createConversation(payload.name, payload.username, payload.avatar);
    this.saveConversations([conversation, ...this.getConversations()]);
    return conversation;
  }

  async fetchReply(message: string, contact: Pick<Conversation, 'name' | 'username'>): Promise<string> {
    const currentUser = this.auth.getCurrentUser();
    const lowercase = message.toLowerCase();

    if (lowercase.includes("salut") || lowercase.includes("hello") || lowercase.includes("hey")) {
      return `Salut ${currentUser.name} ! Comment tu vas ?`;
    }
    if (lowercase.includes("pourquoi") || lowercase.includes("comment")) {
      return `Bonne question sur "${message}". Laisse-moi reflechir...`;
    }
    return `${contact.name} a recu : "${message}"`;
  }

  clearData(): void {
    this.storage.remove(CONVERSATIONS_KEY);
  }
}
