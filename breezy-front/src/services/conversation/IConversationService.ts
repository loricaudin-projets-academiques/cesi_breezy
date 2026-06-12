/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Conversation } from '../../types';

// Ce que doit savoir faire n'importe quel service de messagerie :
// lire et sauvegarder les conversations, en créer de nouvelles,
// et obtenir la réponse du contact (API distante ou bot local).
export interface IConversationService {
  getConversations(): Conversation[];
  saveConversations(conversations: Conversation[]): void;
  // C'est le service qui sait construire une conversation valide (id, état initial...)
  createConversation(name: string, username: string, avatar?: string): Conversation;
  // Demande une réponse au message envoyé — l'UI n'a pas à savoir d'où elle vient
  fetchReply(message: string, contact: Pick<Conversation, 'name' | 'username'>): Promise<string>;
  // Efface toutes les conversations — appelé à la déconnexion
  clearData(): void;
}
