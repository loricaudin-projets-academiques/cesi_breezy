/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Home, Search, MessageSquare, User } from 'lucide-react';

export type TabType = 'home' | 'search' | 'messages' | 'profile';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hasUnreadMessages: boolean; // Vrai s'il y a des messages non lus (affiche la pastille)
}

// Barre de navigation flottante en bas du téléphone
export default function Navigation({ activeTab, onTabChange, hasUnreadMessages }: NavigationProps) {
  return (
    <div className="absolute bottom-6 left-6 right-6 z-40">
      <div className="glassmorphism rounded-full p-2 px-4 flex items-center justify-around h-16 shadow-[0_12px_36px_rgba(0,0,0,0.85)] select-none">
        
        {/* Accueil */}
        <button
          id="nav-home"
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-2xl relative transition focus:outline-none ${
            activeTab === 'home' ? 'text-white' : 'text-white/45 hover:text-white/70'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'active-nav-glow' : ''}`} />
          <AnimatePresence>
            {activeTab === 'home' && (
              // Petit point lumineux qui glisse sous l'onglet actif grâce au layoutId partagé
              <motion.div
                layoutId="activeNavTabGlowDot"
                className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-breezy-neon glow-neon"
              />
            )}
          </AnimatePresence>
        </button>

        {/* Recherche */}
        <button
          id="nav-search"
          onClick={() => onTabChange('search')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-2xl relative transition focus:outline-none ${
            activeTab === 'search' ? 'text-white' : 'text-white/45 hover:text-white/70'
          }`}
        >
          <Search className={`w-5 h-5 ${activeTab === 'search' ? 'active-nav-glow' : ''}`} />
          <AnimatePresence>
            {activeTab === 'search' && (
              <motion.div
                layoutId="activeNavTabGlowDot"
                className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#AEEBFF] glow-neon"
              />
            )}
          </AnimatePresence>
        </button>

        {/* Messagerie */}
        <button
          id="nav-messages"
          onClick={() => onTabChange('messages')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-2xl relative transition focus:outline-none ${
            activeTab === 'messages' ? 'text-white' : 'text-white/45 hover:text-white/70'
          }`}
        >
          <div className="relative">
            <MessageSquare className={`w-5 h-5 ${activeTab === 'messages' ? 'active-nav-glow' : ''}`} />
            {/* Pastille violette quand on a des messages non lus */}
            {hasUnreadMessages && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-breezy-lavender border border-slate-950 block glow-lavender" />
            )}
          </div>
          <AnimatePresence>
            {activeTab === 'messages' && (
              <motion.div
                layoutId="activeNavTabGlowDot"
                className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#C8B6FF] glow-neon"
              />
            )}
          </AnimatePresence>
        </button>

        {/* Profil */}
        <button
          id="nav-profile"
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-2xl relative transition focus:outline-none ${
            activeTab === 'profile' ? 'text-white' : 'text-white/45 hover:text-white/70'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'active-nav-glow' : ''}`} />
          <AnimatePresence>
            {activeTab === 'profile' && (
              <motion.div
                layoutId="activeNavTabGlowDot"
                className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#E4B5FF] glow-neon"
              />
            )}
          </AnimatePresence>
        </button>

      </div>
    </div>
  );
}
