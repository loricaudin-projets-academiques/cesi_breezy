"use client";

import { createContext, ReactNode, useContext, useState } from "react";

import { UserProfile, ProfileSubTab } from "../types";
import { getErrorMessage } from "../utils/errors";
import { useToast } from "../hooks/useToast";
import { useProfile } from "../hooks/useProfile";
import { useFeed } from "../hooks/useFeed";
import { useConversations } from "../hooks/useConversations";
import { authService } from "../services/ServiceContainer";

type BreezyAppContextValue = ReturnType<typeof useBreezyAppState>;

const BreezyAppContext = createContext<BreezyAppContextValue | null>(null);

function useBreezyAppState() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => authService.isLoggedIn());
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [ambientGlow, setAmbientGlow] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProfileSubTab, setActiveProfileSubTab] = useState<ProfileSubTab>("posts");

  const { toasts, triggerToast, handleRemoveToast } = useToast();
  const profile = useProfile(triggerToast);
  const feed = useFeed(profile.user, triggerToast);
  const conversations = useConversations();

  const postInteractions = {
    postComments: feed.postComments,
    commentDrafts: feed.commentDrafts,
    commentImageDrafts: feed.commentImageDrafts,
    showCommentsForPost: feed.showCommentsForPost,
    onToggleStar: feed.handleToggleStar,
    onToggleLike: feed.handleToggleLike,
    onToggleComments: feed.handleToggleComments,
    onCommentDraftChange: feed.handleCommentDraftChange,
    onCommentImageChange: feed.handleCommentImageChange,
    onAddComment: feed.handleAddComment,
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
      triggerToast(getErrorMessage(error, "Erreur de connexion."));
      throw error;
    }
  };

  const handleRegister = async (name: string, username: string, passkey: string, apiUrl: string) => {
    try {
      openSession(await authService.register(name, username, passkey, apiUrl));
    } catch (error) {
      triggerToast(getErrorMessage(error, "Erreur lors de l'inscription."));
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
    searchQuery,
    setSearchQuery,
    activeProfileSubTab,
    setActiveProfileSubTab,
    toasts,
    triggerToast,
    handleRemoveToast,
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
