/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playTick } from '../../audio';
import { PROFILE_BIO_MAX_LENGTH } from '../../profileLimits';
import { useLang } from '../../translations/LanguageProvider';

interface BioEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue: string;
  onSave: (bio: string) => void;
}

export default function BioEditorModal({ isOpen, onClose, initialValue, onSave }: BioEditorModalProps) {
  const { t } = useLang();
  const [inputValue, setInputValue] = useState(initialValue);
  const remainingCharacters = PROFILE_BIO_MAX_LENGTH - inputValue.length;

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue.slice(0, PROFILE_BIO_MAX_LENGTH));
    }
  }, [isOpen, initialValue]);

  const handleSave = () => {
    onSave(inputValue.slice(0, PROFILE_BIO_MAX_LENGTH));
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
            className="w-full max-w-xs glassmorphism-premium rounded-2xl p-4 border border-white/10 z-10"
          >
            <h4 className="text-xs font-mono text-breezy-purple uppercase tracking-wider mb-2.5 font-bold">
              {t('bioModal.title')}
            </h4>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.slice(0, PROFILE_BIO_MAX_LENGTH))}
              maxLength={PROFILE_BIO_MAX_LENGTH}
              rows={4}
              placeholder={t('bioModal.placeholder')}
              className="w-full resize-none rounded-xl border border-white/5 bg-white/[0.04] p-2.5 text-xs leading-relaxed text-breezy-icy outline-none transition focus:border-breezy-border-active whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
            />
            <p className={`mt-1 text-right font-mono text-[8px] ${remainingCharacters <= 15 ? 'text-breezy-purple' : 'text-white/30'}`}>
              {t('bioModal.charCount', { count: inputValue.length })}
            </p>

            <div className="flex justify-end gap-2 mt-4 pt-2.5 border-t border-white/5">
              <button
                onClick={() => { playTick(); onClose(); }}
                className="text-[10px] text-white/40 hover:text-white/80 py-1.5 px-3"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="text-[10px] bg-breezy-icy text-slate-950 font-semibold rounded-lg px-3.5 py-1.5 hover:bg-breezy-lavender"
              >
                {t('common.save')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
