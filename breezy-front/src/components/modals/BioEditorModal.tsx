/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playTick } from '../../audio';

interface BioEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue: string;
  onSave: (bio: string) => void;
}

// Fenêtre pour modifier la biographie du profil
export default function BioEditorModal({ isOpen, onClose, initialValue, onSave }: BioEditorModalProps) {
  const [inputValue, setInputValue] = useState(initialValue);

  // Quand on rouvre la modal, on recharge la bio actuelle
  // (évite d'afficher une ancienne version non sauvegardée)
  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
    }
  }, [isOpen, initialValue]);

  // Sauvegarde et ferme la modal
  const handleSave = () => {
    onSave(inputValue);
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Contenu de la modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-xs glassmorphism-premium rounded-2xl p-4 border border-white/10 z-10"
          >
            <h4 className="text-xs font-mono text-breezy-purple uppercase tracking-wider mb-2.5 font-bold">
              Modifier ta bio
            </h4>
            {/* Zone de texte limitée à 120 caractères */}
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              maxLength={120}
              rows={3}
              className="w-full text-xs p-2.5 bg-white/[0.04] rounded-xl text-breezy-icy border border-white/5 focus:outline-none focus:border-breezy-border-active resize-none"
            />
            <p className="text-[8px] font-mono text-white/30 text-right mt-1">
              {inputValue.length}/120 caractères
            </p>
            
            {/* Boutons d'action */}
            <div className="flex justify-end gap-2 mt-4 pt-2.5 border-t border-white/5">
              <button
                onClick={() => {
                  playTick();
                  onClose();
                }}
                className="text-[10px] text-white/40 hover:text-white/80 py-1.5 px-3"
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
