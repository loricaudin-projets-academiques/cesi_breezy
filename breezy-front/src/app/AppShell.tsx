"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";

import { playTick } from "../audio";
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
    api.get<{ count: number }>("/notifications/unread-count")
      .then(({ data }) => {
        if (!cancelled) setUnreadNotifications(data.count || 0);
      })
      .catch(() => {
        if (!cancelled) setUnreadNotifications(0);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, isLoginRoute, pathname]);

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

      <main className="w-full min-h-screen md:max-w-[980px] md:w-[calc(100%-12rem)] md:ml-40 md:my-4 md:min-h-[calc(100vh-2rem)] md:rounded-3xl md:border md:border-white/10 bg-[#050505]/70 md:bg-[#050505]/55 flex flex-col relative overflow-hidden z-10 box-border">
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
              hasUnreadMessages={conversations.conversations.some((c) => c.unreadCount > 0)}
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
