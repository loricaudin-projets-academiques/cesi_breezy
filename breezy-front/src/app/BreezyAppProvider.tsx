"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

import { UserProfile } from "../types";
import { getErrorMessage } from "../utils/errors";
import { useProfile } from "../hooks/useProfile";
import { useFeed } from "../hooks/useFeed";
import { useConversations } from "../hooks/useConversations";
import { authService } from "../services/ServiceContainer";

type BreezyAppContextValue = ReturnType<typeof useBreezyAppState>;

const BreezyAppContext = createContext<BreezyAppContextValue | null>(null);
const GUEST_THEME_STORAGE_KEY = "breezy_guest_theme_v2";

function useBreezyAppState() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => authService.isLoggedIn());
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [guestTheme, setGuestTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem(GUEST_THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  });

  const triggerToast = (_message: string) => {
    void _message;
  };
  const profile = useProfile(triggerToast);
  const feed = useFeed(profile.user, triggerToast);
  const conversations = useConversations();
  const ambientGlow = profile.user.ambientGlow !== false;
  const isLightTheme = isLoggedIn ? profile.user.theme === "light" : guestTheme === "light";
  const setAmbientGlow = (enabled: boolean) => {
    void profile.updateCurrentUser({ ambientGlow: enabled });
  };
  const setIsLightTheme = (enabled: boolean) => {
    const nextTheme = enabled ? "light" : "dark";
    if (!isLoggedIn) {
      setGuestTheme(nextTheme);
      window.localStorage.setItem(GUEST_THEME_STORAGE_KEY, nextTheme);
      return;
    }

    void profile.updateCurrentUser({ theme: nextTheme });
  };

  const postInteractions = {
    postComments: feed.postComments,
    commentDrafts: feed.commentDrafts,
    showCommentsForPost: feed.showCommentsForPost,
    commentHasMore: feed.commentHasMore,
    loadingComments: feed.loadingComments,
    onToggleStar: feed.handleToggleStar,
    onToggleLike: feed.handleToggleLike,
    onToggleComments: feed.handleToggleComments,
    onLoadMoreComments: feed.handleLoadMoreComments,
    onCommentDraftChange: feed.handleCommentDraftChange,
    onAddComment: feed.handleAddComment,
    onToggleArchive: feed.handleToggleArchive,
    onTogglePin: feed.handleTogglePin,
    onDeletePost: feed.handleDeletePost,
    triggerToast,
  };

  const openSession = (loggedUser: UserProfile) => {
    profile.setUser(loggedUser);
    setIsLoggedIn(true);
  };

  const handleLogin = async (username: string, passkey: string, apiUrl: string) => {
    try {
      openSession(await authService.login(username, passkey, apiUrl));
    } catch (error) {
      console.error(getErrorMessage(error, "Erreur de connexion."));
      throw error;
    }
  };

  const handleRegister = async (name: string, username: string, passkey: string, apiUrl: string) => {
    try {
      openSession(await authService.register(name, username, passkey, apiUrl));
    } catch (error) {
      console.error(getErrorMessage(error, "Erreur lors de l'inscription."));
      throw error;
    }
  };

  const handleLogout = () => {
    authService.logout();
    feed.resetFeed();
    conversations.resetConversations();
    profile.setUser(authService.getCurrentUser());
    setIsLoggedIn(false);
  };

  return {
    isLoggedIn,
    isHamburgerOpen,
    setIsHamburgerOpen,
    isPostModalOpen,
    setIsPostModalOpen,
    ambientGlow,
    setAmbientGlow,
    isLightTheme,
    setIsLightTheme,
    searchQuery,
    setSearchQuery,
    triggerToast,
    profile,
    feed,
    conversations,
    postInteractions,
    searchedPosts: feed.searchPosts(searchQuery),
    handleLogin,
    handleRegister,
    handleLogout,
  };
}

export function BreezyAppProvider({ children }: { children: ReactNode }) {
  const value = useBreezyAppState();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null;
  }

  return (
    <BreezyAppContext.Provider value={value}>
      {children}
    </BreezyAppContext.Provider>
  );
}

export function useBreezyApp() {
  const context = useContext(BreezyAppContext);

  if (!context) {
    throw new Error("useBreezyApp must be used within BreezyAppProvider");
  }

  return context;
}
