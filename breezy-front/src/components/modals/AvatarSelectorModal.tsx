/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playTick, playChime } from '../../audio';
import { useLang } from '../../translations/LanguageProvider';

interface AvatarSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export default function AvatarSelectorModal({ isOpen, onClose, onSelect }: AvatarSelectorModalProps) {
  const { t } = useLang();
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    playChime();
    onSelect(url.trim());
    setUrl('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => { playTick(); onClose(); }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-xs glassmorphism-premium rounded-2.5xl p-5 border border-white/10 z-10"
          >
            <h4 className="text-xs font-mono text-[#F5FAFF]/40 tracking-widest uppercase mb-3 text-center">
              {t('avatarModal.title')}
            </h4>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs font-sans rounded-xl bg-white/[0.04] p-3 text-breezy-icy placeholder-white/20 border border-white/5 focus:outline-none focus:border-breezy-border-active transition"
              />

              <button
                type="submit"
                disabled={!url.trim()}
                className="w-full py-2.5 rounded-xl bg-breezy-icy hover:bg-breezy-neon text-slate-950 font-sans font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
              >
                {t('avatarModal.apply')}
              </button>

              <button
                type="button"
                onClick={() => { playChime(); onSelect(''); onClose(); }}
                className="w-full py-2 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-white/60 hover:text-white font-sans text-xs uppercase tracking-wider transition"
              >
                {t('avatarModal.useDefault')}
              </button>
            </form>

            <button
              onClick={() => { playTick(); onClose(); }}
              className="w-full mt-3 text-center py-2 text-[10px] font-mono hover:text-breezy-neon text-white/30 border border-white/5 hover:border-white/15 rounded-xl block cursor-pointer transition"
            >
              {t('common.cancel')}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
