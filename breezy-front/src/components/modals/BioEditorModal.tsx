/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playTick } from '../../audio';
import { PROFILE_BIO_MAX_LENGTH } from '../../profileLimits';

interface BioEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue: string;
  onSave: (bio: string) => void;
}

// Fenêtre pour modifier la biographie du profil
export default function BioEditorModal({ isOpen, onClose, initialValue, onSave }: BioEditorModalProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const remainingCharacters = PROFILE_BIO_MAX_LENGTH - inputValue.length;

  // Quand on rouvre la modal, on recharge la bio actuelle
  // (évite d'afficher une ancienne version non sauvegardée)
  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue.slice(0, PROFILE_BIO_MAX_LENGTH));
    }
  }, [isOpen, initialValue]);

  // Sauvegarde et ferme la modal
  const handleSave = () => {
    onSave(inputValue.slice(0, PROFILE_BIO_MAX_LENGTH));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          {/* Cliquer en dehors annule les modifications */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playTick();
              onClose();
            }}
            className="absolute inset-0 bg-breezy-overlay backdrop-blur-sm"
          />
          
          {/* Contenu de la modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-xs glassmorphism-premium rounded-2xl p-4 border border-breezy-border z-10"
          >
            <h4 className="text-xs font-mono text-breezy-purple uppercase tracking-wider mb-2.5 font-bold">
              Modifier ta bio
            </h4>
            {/* Zone de texte limitée à 120 caractères */}
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.slice(0, PROFILE_BIO_MAX_LENGTH))}
              maxLength={PROFILE_BIO_MAX_LENGTH}
              rows={4}
              placeholder="Quelques mots sur toi..."
              className="w-full resize-none rounded-xl border border-breezy-border bg-breezy-card p-2.5 text-xs leading-relaxed text-breezy-icy outline-none transition focus:border-breezy-border-active whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
            />
            <p className={`mt-1 text-right font-mono text-[8px] ${remainingCharacters <= 15 ? 'text-breezy-purple' : 'text-breezy-faint'}`}>
              {inputValue.length}/120 caractères
            </p>
            
            {/* Boutons d'action */}
            <div className="flex justify-end gap-2 mt-4 pt-2.5 border-t border-breezy-border">
              <button
                onClick={() => {
                  playTick();
                  onClose();
                }}
                className="text-[10px] text-breezy-muted hover:text-breezy-icy py-1.5 px-3"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="text-[10px] bg-breezy-icy text-slate-950 font-semibold rounded-lg px-3.5 py-1.5 hover:bg-breezy-lavender"
              >
                Enregistrer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
