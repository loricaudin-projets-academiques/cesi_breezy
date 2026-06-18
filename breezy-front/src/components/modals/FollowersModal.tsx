/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, UserPlus } from 'lucide-react';
import { ProfileStatType } from '../../types';
import { INITIAL_FOLLOWERS } from '../../mockData';
import { playTick } from '../../audio';
import { getAvatarUrl } from '../Avatar';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ProfileStatType;
  triggerToast: (msg: string) => void;
}

// Modal qui affiche la liste des abonnés, abonnements ou amis
export default function FollowersModal({ isOpen, onClose, type, triggerToast }: FollowersModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          {/* Fond flouté cliquable pour fermer */}
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
            className="w-full max-w-xs glassmorphism-premium rounded-2.5xl p-5 border border-breezy-border z-10 flex flex-col max-h-[460px]"
          >
            {/* Titre qui change selon l'onglet sélectionné */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-breezy-border">
              <span className="text-xs font-mono text-breezy-neon uppercase tracking-wider font-bold">
                {type === 'followers' && 'Abonnés'}
                {type === 'following' && 'Abonnements'}
                {type === 'friends' && 'Amis proches'}
              </span>
              <span className="text-[10px] font-mono text-breezy-faint">LOCAL</span>
            </div>

            {/* Liste des membres — scrollable si elle déborde */}
            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2.5">
              {INITIAL_FOLLOWERS.length === 0 ? (
                <div className="py-8 text-center text-breezy-faint text-[10.5px] font-sans">
                  Personne dans cette liste pour l'instant.
                </div>
              ) : (
                INITIAL_FOLLOWERS.map((m, idx) => (
                  <div key={idx} className="p-2 bg-breezy-card border border-breezy-border rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Avatar généré ou personnalisé */}
                      <img src={getAvatarUrl(m.avatar, m.username, m.name)} className="w-7 h-7 rounded-full object-cover border border-breezy-border" alt="" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-sans font-medium text-breezy-icy truncate">{m.name}</p>
                        <p className="text-[8.5px] font-mono text-breezy-muted truncate">{m.username}</p>
                      </div>
                    </div>
                    {/* Bouton d'action (follow / unfollow) */}
                    <button
                      onClick={() => {
                        playTick();
                        triggerToast(`Action effectuée pour ${m.name}`);
                      }}
                      className="py-1 px-2 text-[8px] font-bold font-mono rounded bg-breezy-card hover:bg-breezy-card-hover border border-breezy-border transition shrink-0 active:scale-95"
                    >
                      {m.followedByMe ? (
                        <span className="text-breezy-neon flex items-center gap-0.5">
                          <UserCheck className="w-2.5 h-2.5" /> suivi
                        </span>
                      ) : (
                        <span className="text-breezy-muted flex items-center gap-0.5">
                          <UserPlus className="w-2.5 h-2.5" /> suivre
                        </span>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                playTick();
                onClose();
              }}
              className="w-full mt-4 text-center py-2 text-[10px] font-mono hover:text-breezy-purple text-breezy-faint border border-breezy-border hover:border-breezy-border-active rounded-xl block cursor-pointer transition"
            >
              Fermer
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
