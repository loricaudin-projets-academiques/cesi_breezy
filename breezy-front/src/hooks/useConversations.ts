/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Conversation } from '../types';
import { conversationService } from '../services/ServiceContainer';

// Gère la liste des conversations et la synchronise automatiquement avec le stockage
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    // On charge ce qui était déjà sauvegardé dès l'initialisation
    return conversationService.getConversations();
  });

  // Dès que conversations change, on sauvegarde — pas besoin de penser à le faire manuellement
  useEffect(() => {
    conversationService.saveConversations(conversations);
  }, [conversations]);

  // Vide la messagerie et efface ses données persistées — utilisé à la déconnexion
  const resetConversations = () => {
    conversationService.clearData();
    setConversations([]);
  };

  return {
    conversations,
    setConversations,
    resetConversations,
  };
}
