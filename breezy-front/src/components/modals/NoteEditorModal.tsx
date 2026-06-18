/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playTick } from '../../audio';
import { PROFILE_NOTE_MAX_LENGTH } from '../../profileLimits';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue: string;
  onSave: (note: string) => void;
}

// Fenêtre pour modifier la petite note d'humeur visible sur le profil
export default function NoteEditorModal({ isOpen, onClose, initialValue, onSave }: NoteEditorModalProps) {
  const [inputValue, setInputValue] = useState(initialValue);

  // On recharge la valeur actuelle chaque fois que la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue.slice(0, PROFILE_NOTE_MAX_LENGTH));
    }
  }, [isOpen, initialValue]);

  // Enregistre et ferme
  const handleSave = () => {
    onSave(inputValue.slice(0, PROFILE_NOTE_MAX_LENGTH));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          {/* Zone cliquable pour fermer sans sauvegarder */}
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
            <h4 className="text-xs font-mono text-breezy-neon uppercase tracking-wider mb-2.5 font-bold">
              Ta note du moment
            </h4>
            {/* Champ court — max 40 caractères pour rester concis */}
            <input
              type="text"
              placeholder="Ce que tu ressens là..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.slice(0, PROFILE_NOTE_MAX_LENGTH))}
              maxLength={PROFILE_NOTE_MAX_LENGTH}
              className="w-full text-xs p-2.5 bg-breezy-card rounded-xl text-breezy-icy border border-breezy-border focus:outline-none focus:border-breezy-border-active"
            />
            <p className="text-[8px] font-mono text-breezy-faint text-right mt-1">
              {inputValue.length}/40 caractères
            </p>
            
            {/* Boutons de validation ou d'annulation */}
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
                className="text-[10px] bg-breezy-icy text-slate-950 font-semibold rounded-lg px-3.5 py-1.5 hover:bg-breezy-neon"
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
