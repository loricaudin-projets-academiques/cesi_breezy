/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Archive, Bookmark, Check, Heart, HeartCrack, Settings, ShieldAlert, Trash2, X } from 'lucide-react';
import { Post, UserProfile } from '../types';
import { getAvatarUrl } from './Avatar';
import { playTick, playChime, isSoundEnabled, setSoundEnabled } from '../audio';
import { forceNavigate } from '../utils/navigation';

interface HamburgerPanelProps {
  isOpen: boolean;
  initialView?: PanelView;
  onClose: () => void;
  posts: Post[];
  onToggleLike: (postId: string) => void;
  ambientGlow: boolean;
  onToggleAmbientGlow: () => void;
  isLightTheme: boolean;
  onToggleLightTheme: () => void;
  language: UserProfile['language'];
  onToggleLanguage: () => void;
  isPrivate: boolean;
  onTogglePrivate: () => void;
  onLoadArchive: () => Promise<Post[]>;
  onToggleArchive: (postId: string) => void;
  onDeletePost: (postId: string, title?: string) => boolean | Promise<boolean>;
  triggerToast: (msg: string) => void;
  onLogout: () => void;
}

export type PanelView = 'menu' | 'settings' | 'liked' | 'saved' | 'archive';

function Toggle({ enabled, onClick, accent = 'bg-breezy-neon' }: { enabled: boolean; onClick: () => void; accent?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
        enabled ? accent : 'bg-white/10'
      }`}
    >
      <div className={`bg-slate-900 w-4.5 h-4.5 rounded-full shadow-md transform duration-200 ${enabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
    </button>
  );
}

export default function HamburgerPanel({
  isOpen,
  initialView = 'menu',
  onClose,
  posts,
  onToggleLike,
  ambientGlow,
  onToggleAmbientGlow,
  isLightTheme,
  onToggleLightTheme,
  language,
  onToggleLanguage,
  isPrivate,
  onTogglePrivate,
  onLoadArchive,
  onToggleArchive,
  onDeletePost,
  triggerToast,
  onLogout
}: HamburgerPanelProps) {
  const [activeView, setActiveView] = useState<PanelView>('menu');
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [archivedPosts, setArchivedPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const isEnglish = language === 'en';

  const likedPosts = posts.filter((post) => post.likedByUser);
  const savedPosts = posts.filter((post) => post.starredByUser);
  const labels = {
    settings: isEnglish ? 'Settings' : 'Parametres',
    liked: isEnglish ? 'Liked posts' : 'Posts likes',
    saved: isEnglish ? 'Saved posts' : 'Posts sauvegardes',
    archive: isEnglish ? 'Archive' : 'Archive',
    back: isEnglish ? 'Back to menu' : 'Retour au menu',
  };

  const transitionTo = (view: PanelView) => {
    playTick();
    setActiveView(view);
    if (view === 'archive') {
      void onLoadArchive().then(setArchivedPosts);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    setActiveView(initialView);
    if (initialView === 'archive') {
      void onLoadArchive().then(setArchivedPosts);
    }
  }, [initialView, isOpen, onLoadArchive]);

  const handleSoundToggle = () => {
    const newVal = !soundOn;
    setSoundOn(newVal);
    setSoundEnabled(newVal);
    playTick();
    triggerToast(newVal ? 'Sons actives' : 'Sons desactives');
  };

  const handleUnlikeFromList = (id: string, name: string) => {
    onToggleLike(id);
    playChime();
    triggerToast(`Like retire pour le post de ${name}`);
  };

  const title = activeView === 'menu' ? 'Menu' : labels[activeView];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => { playTick(); onClose(); }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-pointer"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 w-[82%] max-w-[320px] bg-[#08080c] border-l border-white/10 p-5 flex flex-col z-50 shadow-[-10px_0_40px_rgba(0,0,0,0.9)] text-breezy-icy"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 shrink-0">
              <h3 className="text-[20px] leading-6 font-bold text-white/95 select-none">{title}</h3>
              <button
                onClick={() => { playTick(); onClose(); }}
                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              <AnimatePresence mode="wait">
                {activeView === 'menu' && (
                  <motion.div key="menu" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-3">
                    <button onClick={() => transitionTo('settings')} className="w-full p-4 rounded-xl glassmorphic border border-white/5 hover:border-breezy-border-active flex items-center gap-3.5 transition group text-left">
                      <div className="p-2 rounded-lg bg-breezy-neon/10 text-breezy-neon group-hover:scale-105 transition">
                        <Settings className="w-4 h-4 active-nav-glow" />
                      </div>
                      <div>
                        <h4 className="text-[15px] leading-5 font-bold">{labels.settings}</h4>
                        <p className="text-[13px] leading-4 text-white/45">{isEnglish ? 'Visual mode, privacy and sounds' : 'Theme, confidentialite et sons'}</p>
                      </div>
                    </button>

                    <button onClick={() => transitionTo('archive')} className="w-full p-4 rounded-xl glassmorphic border border-white/5 hover:border-breezy-border-active flex items-center gap-3.5 transition group text-left">
                      <div className="p-2 rounded-lg bg-breezy-neon/10 text-breezy-neon group-hover:scale-105 transition">
                        <Archive className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[15px] leading-5 font-bold">{labels.archive}</h4>
                        <p className="text-[13px] leading-4 text-white/45">{isEnglish ? 'Your archived posts' : 'Tes posts archives'}</p>
                      </div>
                    </button>

                    <button onClick={() => transitionTo('liked')} className="w-full p-4 rounded-xl glassmorphic border border-white/5 hover:border-breezy-border-active flex items-center gap-3.5 transition group text-left">
                      <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-105 transition">
                        <Heart className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[15px] leading-5 font-bold">{labels.liked}</h4>
                        <p className="text-[13px] leading-4 text-white/45">{likedPosts.length} publication(s)</p>
                      </div>
                    </button>

                    <button onClick={() => transitionTo('saved')} className="w-full p-4 rounded-xl glassmorphic border border-white/5 hover:border-breezy-border-active flex items-center gap-3.5 transition group text-left">
                      <div className="p-2 rounded-lg bg-breezy-lavender/10 text-breezy-lavender group-hover:scale-105 transition">
                        <Bookmark className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[15px] leading-5 font-bold">{labels.saved}</h4>
                        <p className="text-[13px] leading-4 text-white/45">{savedPosts.length} favoris</p>
                      </div>
                    </button>

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
                        <h4 className="text-[15px] leading-5 font-bold text-rose-300">{isEnglish ? 'Log out' : 'Se deconnecter'}</h4>
                        <p className="text-[13px] leading-4 text-rose-400/60">{isEnglish ? 'Close local session' : 'Fermer la session locale'}</p>
                      </div>
                    </button>

                  </motion.div>
                )}

                {activeView === 'settings' && (
                  <motion.div key="settings" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-4">
                    <button onClick={() => transitionTo('menu')} className="text-[13px] leading-4 text-breezy-neon hover:underline mb-2 flex items-center gap-1 cursor-pointer select-none">
                      &larr; {labels.back}
                    </button>

                    <SettingCard title={isEnglish ? 'Light theme' : 'Theme clair'} description={isEnglish ? 'White interface, less transparency and simpler contrast.' : 'Interface blanche, moins transparente, plus simple.'}>
                      <Toggle enabled={isLightTheme} onClick={() => { playTick(); onToggleLightTheme(); }} />
                    </SettingCard>

                    <SettingCard title={isEnglish ? 'Language' : 'Langue'} description={isEnglish ? 'Switch interface labels between English and French.' : "Bascule l'interface entre francais et anglais."}>
                      <button onClick={() => { playTick(); onToggleLanguage(); }} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[13px] leading-4 font-bold">
                        {isEnglish ? 'EN' : 'FR'}
                      </button>
                    </SettingCard>

                    <SettingCard title={isEnglish ? 'Private account' : 'Compte prive'} description={isEnglish ? 'Only friends see your posts, music and note.' : 'Seuls tes amis voient tes posts, ta musique et ta note.'}>
                      <Toggle enabled={isPrivate} onClick={() => { playTick(); onTogglePrivate(); }} accent="bg-breezy-purple" />
                    </SettingCard>

                    <SettingCard title={isEnglish ? 'Ambient halo' : 'Halo ambiant'} description={isEnglish ? 'Shows color halos behind the interface.' : "Active les halos de couleur derriere l'interface."}>
                      <Toggle enabled={ambientGlow} onClick={() => { playTick(); onToggleAmbientGlow(); }} />
                    </SettingCard>

                    <SettingCard title={isEnglish ? 'Interface sounds' : "Sons de l'interface"} description={isEnglish ? 'Small sounds on interactions.' : 'Petits sons a chaque interaction.'}>
                      <Toggle enabled={soundOn} onClick={handleSoundToggle} accent="bg-breezy-purple" />
                    </SettingCard>
                  </motion.div>
                )}

                {activeView === 'liked' && (
                  <PostMiniList
                    emptyIcon={<HeartCrack className="w-8 h-8 opacity-40" />}
                    emptyText={isEnglish ? 'No liked posts yet.' : "Tu n'as encore like aucun post."}
                    posts={likedPosts}
                    backLabel={labels.back}
                    onBack={() => transitionTo('menu')}
                    onPostOpen={setSelectedPost}
                    action={(post) => (
                      <button onClick={() => handleUnlikeFromList(post.id, post.authorName)} className="w-6 h-6 rounded-md hover:bg-rose-500/10 text-rose-400 flex items-center justify-center transition shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  />
                )}

                {activeView === 'saved' && (
                  <PostMiniList
                    emptyIcon={<Bookmark className="w-8 h-8 opacity-40" />}
                    emptyText={isEnglish ? 'No saved posts yet.' : "Aucun post sauvegarde pour l'instant."}
                    posts={savedPosts}
                    backLabel={labels.back}
                    onBack={() => transitionTo('menu')}
                    onPostOpen={setSelectedPost}
                    action={() => <div className="p-1 rounded bg-breezy-lavender/10 text-breezy-lavender shrink-0"><Check className="w-3 h-3" /></div>}
                  />
                )}

                {activeView === 'archive' && (
                  <PostMiniList
                    emptyIcon={<Archive className="w-8 h-8 opacity-40" />}
                    emptyText={isEnglish ? 'No archived posts yet.' : "Aucun post archive pour l'instant."}
                    posts={archivedPosts}
                    backLabel={labels.back}
                    onBack={() => transitionTo('menu')}
                    onPostOpen={setSelectedPost}
                    action={(post) => (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            onToggleArchive(post.id);
                            setArchivedPosts((prev) => prev.filter((item) => item.id !== post.id));
                          }}
                          className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[13px] leading-4 font-bold text-breezy-neon"
                        >
                          {isEnglish ? 'Restore' : 'Restaurer'}
                        </button>
                        <button
                          onClick={async () => {
                            const deleted = await onDeletePost(post.id, post.title || post.content);
                            if (deleted) {
                              setArchivedPosts((prev) => prev.filter((item) => item.id !== post.id));
                            }
                          }}
                          className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-center"
                          title={isEnglish ? 'Delete' : 'Supprimer'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  />
                )}
              </AnimatePresence>
            </div>

            <div className="shrink-0 pt-4 border-t border-white/5 text-center text-[13px] leading-4 text-white/25 select-none">
              Breezy Social Client v1.2.0
            </div>
          </motion.div>

          <AnimatePresence>
            {selectedPost && (
              <motion.div
                key="post-drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                drag="x"
                dragConstraints={{ left: 0, right: 180 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 100) setSelectedPost(null);
                }}
                className="fixed right-0 top-0 bottom-0 w-[88%] max-w-[420px] bg-[#08080c] border-l border-white/10 z-[60] shadow-[-12px_0_44px_rgba(0,0,0,0.9)] p-5 flex flex-col gap-4"
              >
                <button
                  onClick={() => setSelectedPost(null)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/85"
                >
                  <X className="w-4 h-4" />
                </button>

                <button
                  onClick={() => forceNavigate(`/profile/${encodeURIComponent(selectedPost.authorUsername)}`)}
                  className="flex items-center gap-3 text-left"
                >
                  <img src={getAvatarUrl(selectedPost.avatar, selectedPost.authorUsername, selectedPost.authorName)} className="w-11 h-11 rounded-full object-cover border border-white/10" alt="" />
                  <div>
                    <h3 className="text-sm font-bold text-breezy-icy">{selectedPost.authorName}</h3>
                    <p className="text-xs font-mono text-purple-300">{selectedPost.authorUsername}</p>
                  </div>
                </button>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 overflow-y-auto no-scrollbar">
                  {selectedPost.title && <h2 className="text-lg font-bold mb-2">{selectedPost.title}</h2>}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{selectedPost.content}</p>
                  {selectedPost.images?.[0] && (
                    <img src={selectedPost.images[0]} className="mt-4 rounded-xl w-full object-cover" alt="" />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

function SettingCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="p-3.5 rounded-xl glassmorphic border border-white/5 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[15px] leading-5 font-bold">{title}</span>
        {children}
      </div>
      <p className="text-[13px] leading-4 text-white/45">{description}</p>
    </div>
  );
}

function PostMiniList({
  posts,
  emptyIcon,
  emptyText,
  backLabel,
  onBack,
  onPostOpen,
  action,
}: {
  posts: Post[];
  emptyIcon: ReactNode;
  emptyText: string;
  backLabel: string;
  onBack: () => void;
  onPostOpen: (post: Post) => void;
  action: (post: Post) => ReactNode;
}) {
  return (
    <motion.div key="post-list" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-3">
      <button onClick={onBack} className="text-[13px] leading-4 text-breezy-neon hover:underline mb-2 flex items-center gap-1 cursor-pointer">
        &larr; {backLabel}
      </button>

      {posts.length === 0 ? (
        <div className="py-12 text-center text-white/35 flex flex-col items-center gap-2">
          {emptyIcon}
          <span className="text-[13px] leading-4 select-none">{emptyText}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {posts.map((post) => (
            <button key={post.id} onClick={() => onPostOpen(post)} className="w-full p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2 text-left hover:border-breezy-border-active/40">
              <div className="flex items-center gap-2 min-w-0">
                <img src={getAvatarUrl(post.avatar, post.authorUsername, post.authorName)} className="w-6 h-6 rounded-full object-cover border border-white/10" alt="" />
                <div className="min-w-0">
                  <p className="text-[13px] leading-4 font-bold text-breezy-icy truncate">{post.title || post.authorName}</p>
                  <p className="text-[13px] leading-4 text-white/45 truncate">{post.content}</p>
                </div>
              </div>
              <span onClick={(event) => event.stopPropagation()}>{action(post)}</span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
