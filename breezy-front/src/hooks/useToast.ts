/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';

export interface ToastItem {
  id: string;
  message: string;
}

export function useToast(enabled = true) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const triggerToast = useCallback((message: string) => {
    if (!enabled) return;

    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3800);
  }, [enabled]);

  const handleRemoveToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return {
    toasts,
    triggerToast,
    handleRemoveToast,
  };
}
