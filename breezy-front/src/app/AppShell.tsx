"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

import { playChime, playTick } from "../audio";
import { forceNavigate } from "../utils/navigation";
import AmbientGlow from "../components/AmbientGlow";
import Navigation, { TabType } from "../components/Navigation";
import HamburgerPanel, { PanelView } from "../components/HamburgerPanel";
import PostCreationModal from "../components/PostCreationModal";
import NoteEditorModal from "../components/modals/NoteEditorModal";
import BioEditorModal from "../components/modals/BioEditorModal";
import AvatarSelectorModal from "../components/modals/AvatarSelectorModal";
import FollowersModal from "../components/modals/FollowersModal";
import { api } from "../services/api";
import { useBreezyApp } from "./BreezyAppProvider";
import { useTranslation } from "../hooks/useTranslation";

const tabRoutes: Record<TabType, string> = {
  home: "/feed",
  search: "/search",
  messages: "/messages",
  notifications: "/notifications",
  profile: "/profile",
};

function getActiveTab(pathname: string): TabType {
  if (pathname.startsWith("/search")) return "search";
  if (pathname.startsWith("/messages")) return "messages";
  if (pathname.startsWith("/notifications")) return "notifications";
  if (pathname.startsWith("/profile")) return "profile";
  return "home";
}

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);
  const isLoginRoute = pathname.startsWith("/login");
  const [hamburgerInitialView, setHamburgerInitialView] = useState<PanelView>("menu");
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const {
    isLoggedIn,
    ambientGlow,
    setAmbientGlow,
    isLightTheme,
    setIsLightTheme,
    conversations,
    profile,
    feed,
    isHamburgerOpen,
    setIsHamburgerOpen,
    isPostModalOpen,
    setIsPostModalOpen,
    handleLogout,
    triggerToast,
    toasts,
    deleteConfirm,
    setDeleteConfirm,
  } = useBreezyApp();

  useEffect(() => {
    if (!isLoggedIn && !isLoginRoute) {
      router.replace("/login");
    }

    if (isLoggedIn && isLoginRoute) {
      router.replace("/feed");
    }
  }, [isLoggedIn, isLoginRoute, router]);

  useEffect(() => {
    if (!isLoggedIn || isLoginRoute) {
      setUnreadNotifications(0);
      return;
    }

    let cancelled = false;

    const fetchCount = () => {
      api.get<{ count: number }>("/notifications/unread-count")
        .then(({ data }) => {
          if (!cancelled) setUnreadNotifications(data.count || 0);
        })
        .catch(() => {
          if (!cancelled) setUnreadNotifications(0);
        });
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isLoggedIn, isLoginRoute, pathname]);

  useEffect(() => {
    document.documentElement.lang = profile.user.language || "fr";
  }, [profile.user.language]);

  const handleTabChange = (tab: TabType) => {
    playTick();
    forceNavigate(tabRoutes[tab]);
  };

  const openPanel = (view: PanelView = "menu") => {
    setHamburgerInitialView(view);
    setIsHamburgerOpen(true);
  };

  const closePanel = () => {
    setIsHamburgerOpen(false);
    setHamburgerInitialView("menu");
  };

  return (
    <div className={`${isLightTheme ? "theme-light" : ""} min-h-screen bg-[#050505] bg-gradient-custom text-icy flex flex-col items-center relative overflow-hidden font-sans`}>
      <AmbientGlow enabled={ambientGlow && !isLightTheme} />
      {!isLightTheme && (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />
      )}

      <main className="w-full h-screen md:max-w-[980px] md:w-[calc(100%-9.5rem)] md:ml-[150px] lg:max-w-[1120px] lg:w-[calc(100%-12rem)] lg:ml-[180px] md:my-4 md:h-[calc(100vh-2rem)] md:rounded-3xl md:border md:border-white/10 bg-[#050505]/70 md:bg-[#050505]/55 flex flex-col relative overflow-hidden z-10 box-border">
        {isLoginRoute ? (
          children
        ) : (
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-24 relative select-none">
              <AnimatePresence mode="wait">{children}</AnimatePresence>
            </div>

            <Navigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
              unreadMessages={conversations.conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
              unreadNotifications={unreadNotifications}
              onOpenMenu={() => openPanel("menu")}
              onOpenPanel={openPanel}
              onLogout={handleLogout}
            />
          </>
        )}

        <NoteEditorModal
          isOpen={profile.showNoteEditor}
          onClose={() => profile.setShowNoteEditor(false)}
          initialValue={profile.user.note}
          onSave={profile.handleSaveNote}
        />

        <BioEditorModal
          isOpen={profile.showBioEditor}
          onClose={() => profile.setShowBioEditor(false)}
          initialName={profile.user.name}
          initialValue={profile.user.bio}
          onSave={profile.handleSaveBio}
        />

        <AvatarSelectorModal
          isOpen={profile.showAvatarSelector}
          onClose={() => profile.setShowAvatarSelector(false)}
          onSelect={(url) => profile.handleSelectAvatar(url, feed.updateAuthorAvatar)}
        />

        <FollowersModal
          isOpen={profile.showFollowersModal}
          onClose={() => profile.setShowFollowersModal(false)}
          type={profile.followersModalType}
          members={profile.socialLists[profile.followersModalType]}
          isLoading={profile.isSocialListLoading}
          triggerToast={triggerToast}
          onToggleFollow={profile.handleToggleFollow}
        />

        <HamburgerPanel
          user={profile.user}
          isOpen={isHamburgerOpen}
          initialView={hamburgerInitialView}
          onClose={closePanel}
          posts={feed.posts}
          onToggleLike={feed.handleToggleLike}
          onToggleStar={feed.handleToggleStar}
          ambientGlow={ambientGlow}
          onToggleAmbientGlow={() => setAmbientGlow(!ambientGlow)}
          isLightTheme={isLightTheme}
          onToggleLightTheme={() => setIsLightTheme(!isLightTheme)}
          language={profile.user.language || "fr"}
          onToggleLanguage={() => void profile.updateCurrentUser({ language: profile.user.language === "en" ? "fr" : "en" })}
          onLoadArchive={feed.loadArchivedPosts}
          onToggleArchive={feed.handleToggleArchive}
          onDeletePost={feed.handleDeletePost}
          triggerToast={triggerToast}
          onLogout={handleLogout}
        />

        <PostCreationModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onAddPost={feed.handleAddPost}
        />
      </main>

      <ToastContainer toasts={toasts} />
      
      <DeleteConfirmModal
        confirm={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

function ToastContainer({ toasts }: { toasts: { id: string; message: string }[] }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-[90%] max-w-[340px]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="p-3.5 rounded-2xl glassmorphic border border-white/10 bg-slate-950/95 text-breezy-icy text-xs font-sans font-bold shadow-2xl flex items-center justify-between pointer-events-auto"
          >
            <span>{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function DeleteConfirmModal({
  confirm,
  onClose,
}: {
  confirm: { postId: string; postTitle: string; resolve: (val: boolean) => void; isOpen: boolean } | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {confirm && confirm.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playTick();
              confirm.resolve(false);
              onClose();
            }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 15 }}
            className="w-full max-w-sm glassmorphism-premium rounded-3xl p-5 border border-white/10 relative shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-10 flex flex-col gap-4 text-left"
          >
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-bold text-white font-sans">
                {t('modal.delete_post_title')}
              </h3>
              <p className="text-xs text-white/65 leading-relaxed font-sans">
                {t('modal.delete_post_confirm', { title: confirm.postTitle })}
              </p>
            </div>

            <div className="flex gap-2 justify-end font-sans">
              <button
                onClick={() => {
                  playTick();
                  confirm.resolve(false);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white/70 hover:text-white transition"
              >
                {t('action.cancel')}
              </button>
              <button
                onClick={() => {
                  playChime();
                  confirm.resolve(true);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs font-bold text-white transition active:scale-95 shadow-md shadow-rose-950"
              >
                {t('action.delete')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
