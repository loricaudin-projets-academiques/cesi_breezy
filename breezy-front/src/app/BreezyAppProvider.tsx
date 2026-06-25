"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

import { UserProfile } from "../types";
import { getErrorMessage } from "../utils/errors";
import { useProfile } from "../hooks/useProfile";
import { useFeed } from "../hooks/useFeed";
import { useConversations } from "../hooks/useConversations";
import { authService } from "../services/ServiceContainer";
import { API_TOKEN_STORAGE_KEY } from "../services/api";

type BreezyAppContextValue = ReturnType<typeof useBreezyAppState>;

const BreezyAppContext = createContext<BreezyAppContextValue | null>(null);
const GUEST_THEME_STORAGE_KEY = "breezy_guest_theme_v2";

// Vérifie que le JWT stocké n'est pas expiré (décodage sans bibliothèque)
function isStoredJwtValid(): boolean {
  if (typeof window === "undefined") return false;
  const token = window.localStorage.getItem(API_TOKEN_STORAGE_KEY);
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function useBreezyAppState() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [guestTheme, setGuestTheme] = useState<"dark" | "light">("dark");

  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    postId: string;
    postTitle: string;
    resolve: (value: boolean) => void;
  } | null>(null);

  useEffect(() => {
    setIsLoggedIn(authService.isLoggedIn() && isStoredJwtValid());
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(GUEST_THEME_STORAGE_KEY);
      if (stored === "light") {
        setGuestTheme("light");
      }
    }
  }, []);

  const triggerToast = useCallback((message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const confirmDelete = useCallback((postId: string, postTitle: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setDeleteConfirm({
        isOpen: true,
        postId,
        postTitle,
        resolve,
      });
    });
  }, []);

  const profile = useProfile(triggerToast);
  const feed = useFeed(profile.user, triggerToast, confirmDelete);
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
    commentReplies: feed.commentReplies,
    showRepliesForComment: feed.showRepliesForComment,
    onToggleStar: feed.handleToggleStar,
    onToggleLike: feed.handleToggleLike,
    onToggleComments: feed.handleToggleComments,
    onLoadMoreComments: feed.handleLoadMoreComments,
    onCommentDraftChange: feed.handleCommentDraftChange,
    onAddComment: feed.handleAddComment,
    onToggleArchive: feed.handleToggleArchive,
    onTogglePin: feed.handleTogglePin,
    onDeletePost: feed.handleDeletePost,
    onEditPost: feed.handleEditPost,
    onToggleReplies: feed.handleToggleReplies,
    onAddReply: feed.handleAddReply,
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
      triggerToast(getErrorMessage(error, "Identifiant ou mot de passe incorrect."));
      throw error;
    }
  };

  const handleRegister = async (name: string, email: string, username: string, passkey: string, apiUrl: string) => {
    try {
      openSession(await authService.register(name, email, username, passkey, apiUrl));
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

  // Déconnexion automatique si un appel API reçoit un 401 (JWT expiré/invalide)
  useEffect(() => {
    const onUnauthorized = () => handleLogout();
    window.addEventListener("breezy:unauthorized", onUnauthorized);
    return () => window.removeEventListener("breezy:unauthorized", onUnauthorized);
  // handleLogout est stable, pas besoin de le mettre en dépendance
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    toasts,
    setToasts,
    deleteConfirm,
    setDeleteConfirm,
    confirmDelete,
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
