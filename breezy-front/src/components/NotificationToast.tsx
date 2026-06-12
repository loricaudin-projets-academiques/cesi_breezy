/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'cyber';
}

interface NotificationToastProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

// Empile les notifications en haut du smartphone — elles apparaissent et disparaissent en douceur
export default function NotificationToast({ toasts, onRemove }: NotificationToastProps) {
  return (
    <div className="absolute top-16 left-4 right-4 z-50 pointer-events-none flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          // Animation de glissement depuis le haut avec un effet ressort
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="pointer-events-auto w-full glassmorphic rounded-xl p-3 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.6)] border border-breezy-border-active/30"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg bg-breezy-neon/10 text-breezy-neon">
                <Sparkles className="w-4 h-4 active-nav-glow" />
              </div>
              <span className="text-xs font-sans font-medium text-breezy-icy">
                {toast.message}
              </span>
            </div>
            {/* Bouton pour fermer manuellement la notification */}
            <button
              onClick={() => onRemove(toast.id)}
              className="text-[10px] text-white/40 hover:text-white/80 px-1.5 py-0.5 rounded hover:bg-white/5 transition"
            >
              Fermer
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
