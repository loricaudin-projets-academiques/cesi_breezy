/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Conversation } from '../types';
import { conversationService } from '../services/ServiceContainer';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    return conversationService.getConversations();
  });

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      conversationService.fetchConversations()
        .then((nextConversations) => {
          if (!cancelled) {
            setConversations((prev) =>
              nextConversations.map((newConv) => {
                const existing = prev.find((c) => c.id === newConv.id);
                if (!existing) return newConv;

                // Compter les nouveaux messages de l'autre personne arrivés depuis le dernier poll
                const newMessages = newConv.messages.slice(existing.messages.length);
                const newUnread = newMessages.filter((m) => m.sender === 'them').length;

                return {
                  ...newConv,
                  unreadCount: existing.unreadCount + newUnread,
                };
              })
            );
          }
        })
        .catch(() => {});
    };

    refresh();
    const interval = setInterval(refresh, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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
