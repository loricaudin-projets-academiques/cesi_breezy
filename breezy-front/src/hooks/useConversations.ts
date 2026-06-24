/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Conversation } from '../types';
import { conversationService } from '../services/ServiceContainer';

export function useConversations(enabled = true) {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    return conversationService.getConversations();
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    conversationService.fetchConversations()
      .then((nextConversations) => {
        if (!cancelled) {
          setConversations(nextConversations);
        }
      })
      .catch(() => {
        // Keep the local cache usable if the API is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    conversationService.saveConversations(conversations);
  }, [conversations]);

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
