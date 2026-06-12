/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

export interface ToastItem {
  id: string;
  message: string;
}

// Gère l'affichage des notifications flottantes (toasts)
// Chaque toast s'efface tout seul au bout de quelques secondes
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Affiche un message et le retire automatiquement après 3.8 secondes
  const triggerToast = (message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  // Permet à l'utilisateur de fermer un toast avant qu'il expire tout seul
  const handleRemoveToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    toasts,
    triggerToast,
    handleRemoveToast,
  };
}
