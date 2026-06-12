/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe } from 'lucide-react';
import { PostCategory, POST_CATEGORIES } from '../types';
import { playTick, playChime } from '../audio';

interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPost: (content: string, category: PostCategory, image?: string) => void;
}

// Fenêtre de composition d'un nouveau post
export default function PostCreationModal({
  isOpen,
  onClose,
  onAddPost
}: PostCreationModalProps) {
  // Les champs du formulaire
  const [text, setText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>('for-you');
  const [imageUrl, setImageUrl] = useState('');

  // Publication du post et fermeture de la modal
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onAddPost(text.trim(), selectedCategory, imageUrl.trim() || undefined);
    playChime();
    
    // On remet les champs à vide pour la prochaine fois
    setText('');
    setImageUrl('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          {/* Fond sombre — cliquer dessus ferme la modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => { playTick(); onClose(); }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* La modal elle-même */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-full max-w-sm glassmorphism-premium rounded-3xl p-5 border border-white/10 relative shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-10 flex flex-col"
          >
            {/* En-tête avec titre et bouton de fermeture */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-breezy-neon" />
                <span className="text-[10px] font-mono tracking-widest text-[#AEEBFF] uppercase select-none">
                  Nouvelle publication
                </span>
              </div>
              <button
                onClick={() => { playTick(); onClose(); }}
                className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              
              {/* Choix de la catégorie de destination */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest px-0.5">Catégorie</span>
                <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                  {POST_CATEGORIES.map(({ key, label }) => {
                    const isActive = selectedCategory === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { playTick(); setSelectedCategory(key); }}
                        className={`py-1.5 px-0.5 rounded-lg border text-center font-medium font-sans transition truncate ${
                          isActive
                            ? 'bg-breezy-icy text-slate-950 border-breezy-icy'
                            : 'bg-white/[0.02] text-white/50 border-white/5 hover:border-white/15'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Zone de texte principale */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest px-0.5">Ton message</span>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Quoi de neuf ?"
                  maxLength={280}
                  rows={4}
                  className="w-full text-xs p-3 rounded-2xl glassmorphism-light text-breezy-icy placeholder-white/35 border border-white/5 focus:outline-none focus:border-breezy-border-active resize-none transition-all"
                />
                <div className="text-right text-[8px] font-mono text-white/20 mt-0.5">
                  {text.length}/280 caractères
                </div>
              </div>

              {/* Champ optionnel pour ajouter une image par URL */}
              <div className="flex flex-col gap-1.5 font-sans">
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest px-0.5">
                  URL d'image (optionnel)
                </span>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full text-xs p-3 rounded-2xl glassmorphism-light text-breezy-icy placeholder-white/35 border border-white/5 focus:outline-none focus:border-breezy-border-active transition"
                />
              </div>

              {/* Bouton de publication */}
              <div className="flex items-center justify-end pt-2 border-t border-white/5 mt-1 font-sans">
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="py-2.5 px-6 rounded-xl bg-breezy-icy text-slate-950 font-sans font-bold text-xs hover:bg-breezy-neon disabled:opacity-40 disabled:hover:bg-breezy-icy transition active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  Publier &rarr;
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
