/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playTick, playChime } from '../../audio';

interface AvatarSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

// Fenêtre pour changer de photo de profil
// On peut coller une URL ou repasser sur l'avatar généré automatiquement
export default function AvatarSelectorModal({ isOpen, onClose, onSelect }: AvatarSelectorModalProps) {
  const [url, setUrl] = useState('');

  // Valide le formulaire et applique le nouvel avatar
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
          {/* Fond sombre cliquable pour fermer sans changer d'avatar */}
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
            className="w-full max-w-xs glassmorphism-premium rounded-2.5xl p-5 border border-breezy-border z-10"
          >
            <h4 className="text-xs font-mono text-breezy-muted tracking-widest uppercase mb-3 text-center">
              Changer d'avatar
            </h4>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Champ pour l'URL de la nouvelle photo */}
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs font-sans rounded-xl bg-breezy-card p-3 text-breezy-icy placeholder-breezy-muted border border-breezy-border focus:outline-none focus:border-breezy-border-active transition"
              />
              
              {/* Valider avec une URL personnalisée */}
              <button
                type="submit"
                disabled={!url.trim()}
                className="w-full py-2.5 rounded-xl bg-breezy-icy hover:bg-breezy-neon text-slate-950 font-sans font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
              >
                Appliquer cette photo
              </button>

              {/* Revenir à l'avatar généré automatiquement */}
              <button
                type="button"
                onClick={() => {
                  playChime();
                  onSelect('');
                  onClose();
                }}
                className="w-full py-2 rounded-xl border border-breezy-border hover:border-breezy-border-active hover:bg-breezy-card text-breezy-muted hover:text-breezy-icy font-sans text-xs uppercase tracking-wider transition"
              >
                Utiliser l'avatar par défaut
              </button>
            </form>
            
            {/* Fermer sans rien changer */}
            <button
              onClick={() => {
                playTick();
                onClose();
              }}
              className="w-full mt-3 text-center py-2 text-[10px] font-mono hover:text-breezy-neon text-breezy-faint border border-breezy-border hover:border-breezy-border-active rounded-xl block cursor-pointer transition"
            >
              Annuler
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
