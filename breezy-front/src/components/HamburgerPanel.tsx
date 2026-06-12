/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Heart, Bookmark, ShieldAlert, Sparkles, Check, HeartCrack } from 'lucide-react';
import { Post } from '../types';
import { getAvatarUrl } from './Avatar';
import { playTick, playChime, isSoundEnabled, setSoundEnabled } from '../audio';

interface HamburgerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  onToggleLike: (postId: string) => void;
  ambientGlow: boolean;
  onToggleAmbientGlow: () => void;
  triggerToast: (msg: string) => void;
  onLogout: () => void;
}

type PanelView = 'menu' | 'settings' | 'liked' | 'saved';

export default function HamburgerPanel({
  isOpen,
  onClose,
  posts,
  onToggleLike,
  ambientGlow,
  onToggleAmbientGlow,
  triggerToast,
  onLogout
}: HamburgerPanelProps) {
  const [activeView, setActiveView] = useState<PanelView>('menu');
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  // Active ou coupe le son de l'interface
  const handleSoundToggle = () => {
    const newVal = !soundOn;
    setSoundOn(newVal);
    setSoundEnabled(newVal);
    playTick();
    triggerToast(newVal ? "Sons activés" : "Sons désactivés");
  };

  const likedPosts = posts.filter(p => p.likedByUser);
  const savedPosts = posts.filter(p => p.starredByUser);

  // Navigation entre les vues du panneau avec un petit effet sonore
  const transitionTo = (view: PanelView) => {
    playTick();
    setActiveView(view);
  };

  // Retire un like directement depuis la liste des posts aimés
  const handleUnlikeFromList = (id: string, name: string) => {
    onToggleLike(id);
    playChime();
    triggerToast(`Like retiré pour le post de ${name}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fond sombre qui ferme le panneau quand on clique dessus */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => { playTick(); onClose(); }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-pointer"
          />

          {/* Panneau latéral qui glisse depuis la droite */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="absolute right-0 top-0 bottom-0 w-[82%] max-w-[320px] bg-[#08080c] border-l border-white/10 p-5 flex flex-col z-50 shadow-[-10px_0_40px_rgba(0,0,0,0.9)] text-breezy-icy"
          >
            {/* En-tête du panneau avec le titre dynamique */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-breezy-purple animate-ping" />
                <h3 className="text-sm font-display font-medium tracking-wide text-white/95 select-none uppercase">
                  {activeView === 'menu' && 'Menu'}
                  {activeView === 'settings' && 'Paramètres'}
                  {activeView === 'liked' && 'Posts likés'}
                  {activeView === 'saved' && 'Posts sauvegardés'}
                </h3>
              </div>
              <button
                onClick={() => { playTick(); onClose(); }}
                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/50 hover:text-white/90 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Zone de contenu avec transition animée entre les vues */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <AnimatePresence mode="wait">
                {activeView === 'menu' && (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col gap-3"
                  >
                    <p className="text-[11px] font-mono text-white/30 uppercase tracking-widest pl-1 mb-1">Navigation</p>
                    
                    <button
                      onClick={() => transitionTo('settings')}
                      className="w-full p-4 rounded-xl glassmorphic border border-white/5 hover:border-breezy-border-active flex items-center gap-3.5 transition group text-left"
                    >
                      <div className="p-2 rounded-lg bg-breezy-neon/10 text-breezy-neon group-hover:scale-105 transition">
                        <Settings className="w-4 h-4 active-nav-glow" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold">Paramètres</h4>
                        <p className="text-[10px] text-white/40">Ambiance visuelle et sons</p>
                      </div>
                    </button>

                    <button
                      onClick={() => transitionTo('liked')}
                      className="w-full p-4 rounded-xl glassmorphic border border-white/5 hover:border-breezy-border-active flex items-center gap-3.5 transition group text-left"
                    >
                      <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-105 transition">
                        <Heart className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold">Posts likés</h4>
                        <p className="text-[10px] text-white/40">{likedPosts.length} publication(s) aimée(s)</p>
                      </div>
                    </button>

                    <button
                      onClick={() => transitionTo('saved')}
                      className="w-full p-4 rounded-xl glassmorphic border border-white/5 hover:border-breezy-border-active flex items-center gap-3.5 transition group text-left"
                    >
                      <div className="p-2 rounded-lg bg-breezy-lavender/10 text-breezy-lavender group-hover:scale-105 transition">
                        <Bookmark className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold">Posts sauvegardés</h4>
                        <p className="text-[10px] text-white/40">{savedPosts.length} dans tes favoris</p>
                      </div>
                    </button>

                    {/* Bouton de déconnexion — on le met bien en rouge pour qu'on ne le rate pas */}
                    <button
                      onClick={() => {
                        playChime();
                        onClose();
                        onLogout();
                      }}
                      className="w-full p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/40 flex items-center gap-3.5 transition group text-left mt-2 cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-105 transition">
                        <ShieldAlert className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-rose-300">Se déconnecter</h4>
                        <p className="text-[10px] text-rose-400/50">Fermer la session locale</p>
                      </div>
                    </button>

                    {/* Petite carte d'info sur l'app */}
                    <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-[#120f26]/40 to-[#0c142b]/40 border border-breezy-border-active/10 text-center select-none relative overflow-hidden">
                      <div className="absolute -left-10 -top-10 w-24 h-24 rounded-full bg-breezy-neon/5 blur-xl pointer-events-none" />
                      <Sparkles className="w-5 h-5 mx-auto mb-1.5 text-breezy-neon active-nav-glow" />
                      <h5 className="text-[11px] font-mono tracking-widest text-[#AEEBFF] uppercase">Breezy</h5>
                      <p className="text-[10px] text-white/40 mt-1 leading-normal">
                        Interface construite avec Vite et React. Fluide et rapide.
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeView === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col gap-4"
                  >
                    {/* Retour au menu */}
                    <button
                      onClick={() => transitionTo('menu')}
                      className="text-xs text-breezy-neon hover:underline mb-2 flex items-center gap-1 cursor-pointer select-none"
                    >
                      &larr; Retour au menu
                    </button>

                    {/* Interrupteur pour l'effet de halo lumineux */}
                    <div className="p-3.5 rounded-xl glassmorphic border border-white/5 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Halo ambiant</span>
                        <button
                          onClick={() => { playTick(); onToggleAmbientGlow(); }}
                          className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                            ambientGlow ? 'bg-breezy-neon' : 'bg-white/10'
                          }`}
                        >
                          <div
                            className={`bg-slate-900 w-4.5 h-4.5 rounded-full shadow-md transform duration-200 ${
                              ambientGlow ? 'translate-x-4.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-[9.5px] text-white/40 leading-normal">
                        Active les halos de couleur qui flottent derrière l'interface.
                      </p>
                    </div>

                    {/* Interrupteur pour les sons de l'interface */}
                    <div className="p-3.5 rounded-xl glassmorphic border border-white/5 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Sons de l'interface</span>
                        <button
                          onClick={handleSoundToggle}
                          className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                            soundOn ? 'bg-breezy-purple' : 'bg-white/10'
                          }`}
                        >
                          <div
                            className={`bg-slate-900 w-4.5 h-4.5 rounded-full shadow-md transform duration-200 ${
                              soundOn ? 'translate-x-4.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-[9.5px] text-white/40 leading-normal">
                        Joue de petits sons synthétiques à chaque interaction.
                      </p>
                    </div>

                    {/* Infos techniques (simulées pour l'esthétique) */}
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-[9px] text-white/30 flex flex-col gap-1.5">
                      <p className="text-[10px] text-white/40 font-bold mb-0.5">Environnement :</p>
                      <p>MODE: Développement local</p>
                      <p>FRAMEWORK: React + Vite</p>
                      <p>STOCKAGE: localStorage natif</p>
                      <p>LINT: Aucune erreur</p>
                    </div>
                  </motion.div>
                )}

                {activeView === 'liked' && (
                  <motion.div
                    key="liked"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col gap-3"
                  >
                    <button
                      onClick={() => transitionTo('menu')}
                      className="text-xs text-breezy-neon hover:underline mb-2 flex items-center gap-1 cursor-pointer"
                    >
                      &larr; Retour au menu
                    </button>

                    {likedPosts.length === 0 ? (
                      <div className="py-12 text-center text-white/30 flex flex-col items-center gap-2">
                        <HeartCrack className="w-8 h-8 opacity-40" />
                        <span className="text-xs select-none">Tu n'as encore liké aucun post.</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {likedPosts.map(p => (
                          <div key={p.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Avatar de l'auteur du post */}
                              <img src={getAvatarUrl(p.avatar, p.authorUsername, p.authorName)} className="w-6 h-6 rounded-full object-cover border border-white/10" alt="" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-sans font-medium text-breezy-icy truncate">{p.authorName}</p>
                                <p className="text-[9px] text-white/40 truncate">{p.content}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnlikeFromList(p.id, p.authorName)}
                              className="w-6 h-6 rounded-md hover:bg-rose-500/10 text-rose-400 flex items-center justify-center transition shrink-0"
                              title="Retirer le like"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeView === 'saved' && (
                  <motion.div
                    key="saved"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col gap-3"
                  >
                    <button
                      onClick={() => transitionTo('menu')}
                      className="text-xs text-breezy-neon hover:underline mb-2 flex items-center gap-1 cursor-pointer"
                    >
                      &larr; Retour au menu
                    </button>

                    {savedPosts.length === 0 ? (
                      <div className="py-12 text-center text-white/30 flex flex-col items-center gap-2">
                        <Bookmark className="w-8 h-8 opacity-40" />
                        <span className="text-xs select-none">Aucun post sauvegardé pour l'instant.</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {savedPosts.map(p => (
                          <div key={p.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Avatar de l'auteur du post sauvegardé */}
                              <img src={getAvatarUrl(p.avatar, p.authorUsername, p.authorName)} className="w-6 h-6 rounded-full object-cover border border-white/10" alt="" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-sans font-medium text-breezy-icy truncate">{p.authorName}</p>
                                <p className="text-[9px] text-white/40 truncate">{p.content}</p>
                              </div>
                            </div>
                            <div className="p-1 rounded bg-breezy-lavender/10 text-breezy-lavender shrink-0">
                              <Check className="w-3 h-3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Version de l'app en bas du panneau */}
            <div className="shrink-0 pt-4 border-t border-white/5 text-center text-[9px] font-mono text-white/20 select-none">
              Breezy Social Client v1.2.0-Alpha
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
