"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { MessageSquareDiff } from "lucide-react";

import { playTick } from "../audio";
import AmbientGlow from "../components/AmbientGlow";
import Navigation, { TabType } from "../components/Navigation";
import NotificationToast from "../components/NotificationToast";
import HamburgerPanel, { PanelView } from "../components/HamburgerPanel";
import PostCreationModal from "../components/PostCreationModal";
import NoteEditorModal from "../components/modals/NoteEditorModal";
import BioEditorModal from "../components/modals/BioEditorModal";
import AvatarSelectorModal from "../components/modals/AvatarSelectorModal";
import FollowersModal from "../components/modals/FollowersModal";
import { useBreezyApp } from "./BreezyAppProvider";

const tabRoutes: Record<TabType, string> = {
  home: "/feed",
  search: "/search",
  messages: "/messages",
  profile: "/profile",
};

function getActiveTab(pathname: string): TabType {
  if (pathname.startsWith("/search")) return "search";
  if (pathname.startsWith("/messages")) return "messages";
  if (pathname.startsWith("/profile")) return "profile";
  return "home";
}

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);
  const isLoginRoute = pathname.startsWith("/login");
  const [hamburgerInitialView, setHamburgerInitialView] = useState<PanelView>("menu");

  const {
    isLoggedIn,
    ambientGlow,
    setAmbientGlow,
    isLightTheme,
    setIsLightTheme,
    toasts,
    handleRemoveToast,
    conversations,
    profile,
    feed,
    isHamburgerOpen,
    setIsHamburgerOpen,
    isPostModalOpen,
    setIsPostModalOpen,
    handleLogout,
    triggerToast,
  } = useBreezyApp();

  useEffect(() => {
    if (!isLoggedIn && !isLoginRoute) {
      router.replace("/login");
    }

    if (isLoggedIn && isLoginRoute) {
      router.replace("/feed");
    }
  }, [isLoggedIn, isLoginRoute, router]);

  const handleTabChange = (tab: TabType) => {
    playTick();
    router.push(tabRoutes[tab]);
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

      <main className="w-full min-h-screen md:max-w-[980px] md:w-[calc(100%-10rem)] md:ml-32 md:my-4 md:min-h-[calc(100vh-2rem)] md:rounded-3xl md:border md:border-white/10 bg-[#050505]/70 md:bg-[#050505]/55 flex flex-col relative overflow-hidden z-10 box-border">
        <NotificationToast toasts={toasts} onRemove={handleRemoveToast} />

        {isLoginRoute ? (
          children
        ) : (
          <>
            <div className="pt-5 md:pt-6 px-4 md:px-8 pb-2.5 flex justify-end items-center bg-[#050508]/80 backdrop-blur-xl border-b border-white/[0.04] shrink-0 z-30">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playTick();
                    setIsPostModalOpen(true);
                  }}
                  className="p-1 px-2.5 rounded-lg border border-white/5 bg-white/[0.03] hover:border-breezy-border-active flex items-center gap-1.5 hover:text-breezy-neon transition duration-200"
                  title="Compose stream"
                >
                  <MessageSquareDiff className="w-4 h-4" />
                  <span className="text-[9.5px] font-sans font-bold uppercase tracking-wider">Stream</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-24 relative select-none">
              <AnimatePresence mode="wait">{children}</AnimatePresence>
            </div>

            <Navigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
              hasUnreadMessages={conversations.conversations.some((c) => c.unreadCount > 0)}
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
        />

        <HamburgerPanel
          isOpen={isHamburgerOpen}
          initialView={hamburgerInitialView}
          onClose={closePanel}
          posts={feed.posts}
          onToggleLike={feed.handleToggleLike}
          ambientGlow={ambientGlow}
          onToggleAmbientGlow={() => setAmbientGlow(!ambientGlow)}
          isLightTheme={isLightTheme}
          onToggleLightTheme={() => setIsLightTheme(!isLightTheme)}
          language={profile.user.language || "fr"}
          onToggleLanguage={() => void profile.updateCurrentUser({ language: profile.user.language === "en" ? "fr" : "en" })}
          isPrivate={profile.user.isPrivate}
          onTogglePrivate={() => void profile.updateCurrentUser({ isPrivate: !profile.user.isPrivate })}
          notificationsEnabled={profile.user.notificationsEnabled !== false}
          onToggleNotifications={() => void profile.updateCurrentUser({ notificationsEnabled: profile.user.notificationsEnabled === false })}
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
    </div>
  );
}
