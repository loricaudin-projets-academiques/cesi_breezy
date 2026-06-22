/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Conversation, MessageItem } from '../../types';

export interface IConversationService {
  getConversations(): Conversation[];
  saveConversations(conversations: Conversation[]): void;
  createConversation(name: string, username: string, avatar?: string): Conversation;
  fetchConversations(): Promise<Conversation[]>;
  createRemoteConversation(payload: { name: string; username: string; avatar?: string }): Promise<Conversation>;
  sendMessage(conversationId: string, text: string): Promise<MessageItem>;
  fetchReply(message: string, contact: Pick<Conversation, 'name' | 'username'>): Promise<string>;
  clearData(): void;
}
