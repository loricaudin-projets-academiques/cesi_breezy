"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { MessageSquareDiff } from "lucide-react";

import { playTick } from "../audio";
import AmbientGlow from "../components/AmbientGlow";
import PhoneFrame from "../components/PhoneFrame";
import Navigation, { TabType } from "../components/Navigation";
import NotificationToast from "../components/NotificationToast";
import HamburgerPanel from "../components/HamburgerPanel";
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

function getTitle(activeTab: TabType) {
  if (activeTab === "home") {
    return (
      <span className="flex items-center gap-1">
        Breezy <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-breezy-neon/10 text-breezy-neon border border-breezy-neon/20 uppercase tracking-widest leading-none glow-neon">Feed</span>
      </span>
    );
  }

  if (activeTab === "search") return "Search Grid";
  if (activeTab === "messages") return "Secure Direct";
  return "Identity Core";
}

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);
  const isLoginRoute = pathname.startsWith("/login");

  const {
    isLoggedIn,
    ambientGlow,
    setAmbientGlow,
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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isLoggedIn && !isLoginRoute) {
      router.replace("/login");
    }

    if (isLoggedIn && isLoginRoute) {
      router.replace("/feed");
    }
  }, [isLoggedIn, isLoginRoute, router, mounted]);

  const handleTabChange = (tab: TabType) => {
    playTick();
    router.push(tabRoutes[tab]);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#050505] bg-gradient-custom text-icy flex flex-col justify-center items-center p-3 relative overflow-hidden font-sans">
        <AmbientGlow enabled={ambientGlow} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />

        <PhoneFrame>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-xs text-white/30 font-mono tracking-widest uppercase animate-pulse">
              Breezy...
            </span>
          </div>
        </PhoneFrame>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] bg-gradient-custom text-icy flex flex-col justify-center items-center p-3 relative overflow-hidden font-sans">
      <AmbientGlow enabled={ambientGlow} />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />

      <PhoneFrame>
        <NotificationToast toasts={toasts} onRemove={handleRemoveToast} />

        {isLoginRoute ? (
          children
        ) : (
          <>
            <div className="pt-8 px-4 pb-2.5 flex justify-between items-center bg-[#050508]/80 backdrop-blur-xl border-b border-white/[0.04] shrink-0 z-30">
              <div className="flex items-center gap-1.5 select-none">
                <span className="text-sm font-display font-semibold text-breezy-icy uppercase tracking-wide">
                  {getTitle(activeTab)}
                </span>
              </div>

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
          triggerToast={triggerToast}
        />

        <HamburgerPanel
          isOpen={isHamburgerOpen}
          onClose={() => setIsHamburgerOpen(false)}
          posts={feed.posts}
          onToggleLike={feed.handleToggleLike}
          ambientGlow={ambientGlow}
          onToggleAmbientGlow={() => setAmbientGlow(!ambientGlow)}
          triggerToast={triggerToast}
          onLogout={handleLogout}
        />

        <PostCreationModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onAddPost={feed.handleAddPost}
          triggerToast={triggerToast}
        />
      </PhoneFrame>
    </div>
  );
}
