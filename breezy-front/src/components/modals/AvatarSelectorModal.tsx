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

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      playChime();
      onSelect(String(reader.result));
      onClose();
    };
    reader.readAsDataURL(file);
  };

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          {/* Fond sombre cliquable pour fermer sans changer d'avatar */}
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
            className="w-full max-w-xs glassmorphism-premium rounded-2.5xl p-5 border border-white/10 z-10"
          >
            <h4 className="text-xs font-mono text-[#F5FAFF]/40 tracking-widest uppercase mb-3 text-center">
              Changer d'avatar
            </h4>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="w-full py-3 rounded-xl border border-white/10 hover:border-breezy-border-active bg-white/[0.03] text-breezy-icy text-center text-xs font-bold cursor-pointer transition">
                Choisir depuis l'appareil
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    handleFile(event.target.files?.[0]);
                    event.currentTarget.value = '';
                  }}
                />
              </label>

              {/* Champ pour l'URL de la nouvelle photo */}
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs font-sans rounded-xl bg-white/[0.04] p-3 text-breezy-icy placeholder-white/20 border border-white/5 focus:outline-none focus:border-breezy-border-active transition"
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
                className="w-full py-2 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-white/60 hover:text-white font-sans text-xs uppercase tracking-wider transition"
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
              className="w-full mt-3 text-center py-2 text-[10px] font-mono hover:text-breezy-neon text-white/30 border border-white/5 hover:border-white/15 rounded-xl block cursor-pointer transition"
            >
              Annuler
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
