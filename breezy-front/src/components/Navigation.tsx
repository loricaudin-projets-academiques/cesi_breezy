/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Archive, Bell, Bookmark, Heart, Home, LogOut, Menu, MessageSquare, Search, Settings, User } from 'lucide-react';
import type { PanelView } from './HamburgerPanel';

export type TabType = 'home' | 'search' | 'messages' | 'notifications' | 'profile';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hasUnreadMessages: boolean; // Vrai s'il y a des messages non lus (affiche la pastille)
  unreadNotifications: number;
  onOpenMenu?: () => void;
  onOpenPanel?: (view: PanelView) => void;
  onLogout?: () => void;
}

// Barre de navigation flottante en bas du téléphone
export default function Navigation({ activeTab, onTabChange, hasUnreadMessages, unreadNotifications, onOpenMenu, onOpenPanel, onLogout }: NavigationProps) {
  const menuItems = [
    { icon: Settings, label: 'Parametres', view: 'settings' as const },
    { icon: Archive, label: 'Archive', view: 'archive' as const },
    { icon: Heart, label: 'Likes', view: 'liked' as const },
    { icon: Bookmark, label: 'Favoris', view: 'saved' as const },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:left-6 md:top-1/2 md:bottom-auto md:translate-y-[-50%] md:translate-x-0 z-40 w-[min(94vw,560px)] md:w-[138px]">
      <div className="breezy-nav-shell glassmorphism rounded-full md:rounded-3xl p-2 px-4 md:px-3 md:py-5 flex md:flex-col items-center justify-around md:justify-center md:gap-3 h-16 md:h-auto shadow-[0_12px_36px_rgba(0,0,0,0.85)] select-none">
        
        {/* Accueil */}
        <button
          id="nav-home"
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-2xl relative transition focus:outline-none ${
            activeTab === 'home' ? 'text-white' : 'text-white/45 hover:text-white/70'
          }`}
        >
            <Home className={`w-5 h-5 md:w-6 md:h-6 ${activeTab === 'home' ? 'active-nav-glow' : ''}`} />
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
          <Search className={`w-5 h-5 md:w-6 md:h-6 ${activeTab === 'search' ? 'active-nav-glow' : ''}`} />
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
            <MessageSquare className={`w-5 h-5 md:w-6 md:h-6 ${activeTab === 'messages' ? 'active-nav-glow' : ''}`} />
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

        {/* Notifications */}
        <button
          id="nav-notifications"
          onClick={() => onTabChange('notifications')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-2xl relative transition focus:outline-none ${
            activeTab === 'notifications' ? 'text-white' : 'text-white/45 hover:text-white/70'
          }`}
        >
          <div className="relative">
            <Bell className={`w-5 h-5 md:w-6 md:h-6 ${activeTab === 'notifications' ? 'active-nav-glow' : ''}`} />
            {unreadNotifications > 0 && (
              <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 border border-slate-950 text-[9px] leading-4 text-white font-bold text-center">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </div>
          <AnimatePresence>
            {activeTab === 'notifications' && (
              <motion.div
                layoutId="activeNavTabGlowDot"
                className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-rose-400 glow-neon"
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
          <User className={`w-5 h-5 md:w-6 md:h-6 ${activeTab === 'profile' ? 'active-nav-glow' : ''}`} />
          <AnimatePresence>
            {activeTab === 'profile' && (
              <motion.div
                layoutId="activeNavTabGlowDot"
                className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#E4B5FF] glow-neon"
              />
            )}
          </AnimatePresence>
        </button>

        <div className="hidden md:flex w-full flex-col items-center gap-2 pt-3 mt-1 border-t border-white/10">
          {menuItems.map(({ icon: Icon, label, view }) => (
            <button
              key={label}
              onClick={() => onOpenPanel?.(view)}
              className="w-full flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl text-white/55 hover:text-breezy-neon hover:bg-white/[0.04] transition"
              title={label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[12px] leading-4 font-bold">{label}</span>
            </button>
          ))}

          <button
            onClick={onOpenMenu}
            className="w-full flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl text-white/55 hover:text-breezy-neon hover:bg-white/[0.04] transition"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[12px] leading-4 font-bold">Menu</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl text-rose-300/75 hover:text-rose-300 hover:bg-rose-500/10 transition"
            title="Se deconnecter"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[12px] leading-4 font-bold">Sortir</span>
          </button>
        </div>

      </div>
    </div>
  );
}
