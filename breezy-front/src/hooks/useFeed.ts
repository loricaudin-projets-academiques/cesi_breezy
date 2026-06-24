/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CommentsByPost, Post, PostCategory, UserProfile } from '../types';
import { playTick, playChime } from '../audio';
import { feedService } from '../services/ServiceContainer';
import { getErrorMessage } from '../utils/errors';

export function useFeed(
  currentUser: UserProfile,
  triggerToast: (msg: string) => void,
  enabled = true
) {
  const [posts, setPosts] = useState<Post[]>(() => feedService.getPosts());
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [homeCategory, setHomeCategory] = useState<PostCategory>('for-you');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<CommentsByPost>(() => feedService.getComments());
  const [showCommentsForPost, setShowCommentsForPost] = useState<Record<string, boolean>>({});
  const [commentPages, setCommentPages] = useState<Record<string, number>>({});
  const [commentHasMore, setCommentHasMore] = useState<Record<string, boolean>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const commentsInFlight = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || !currentUser.username) return;

    let cancelled = false;

    async function loadFeed() {
      try {
        const nextPosts = await feedService.fetchPosts(homeCategory);

        if (!cancelled) {
          setPosts(nextPosts);
        }
      } catch (error) {
        if (!cancelled) {
          triggerToast(getErrorMessage(error, "Impossible de charger le fil."));
        }
      }
    }

    loadFeed();

    return () => {
      cancelled = true;
    };
  }, [currentUser.username, enabled, homeCategory, triggerToast]);

  useEffect(() => {
    if (!enabled || !currentUser.username) return;

    let cancelled = false;

    async function loadUserPosts() {
      try {
        const nextUserPosts = await feedService.fetchUserPosts(currentUser.username);

        if (!cancelled) {
          setUserPosts(nextUserPosts);
        }
      } catch (error) {
        if (!cancelled) {
          triggerToast(getErrorMessage(error, "Impossible de charger tes publications."));
        }
      }
    }

    loadUserPosts();

    return () => {
      cancelled = true;
    };
  }, [currentUser.username, enabled, triggerToast]);

  useEffect(() => {
    feedService.savePosts(posts);
  }, [posts]);

  useEffect(() => {
    feedService.saveComments(postComments);
  }, [postComments]);

  const updateAuthorAvatar = (avatarUrl: string) => {
    setPosts((pList) =>
      pList.map((p) => (p.authorUsername === currentUser.username ? { ...p, avatar: avatarUrl } : p))
    );
    setUserPosts((pList) =>
      pList.map((p) => (p.authorUsername === currentUser.username ? { ...p, avatar: avatarUrl } : p))
    );
  };

  const findKnownPost = (postId: string) =>
    posts.find((p) => p.id === postId) || userPosts.find((p) => p.id === postId);

  const updateKnownPost = (updatedPost: Post) => {
    setPosts((prev) => prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)));
    setUserPosts((prev) => prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)));
  };

  const removeKnownPost = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    setUserPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const handleCategoryChange = (cat: PostCategory) => {
    playTick();
    setHomeCategory(cat);
  };

  const handleToggleLike = async (postId: string) => {
    const target = findKnownPost(postId);
    if (!target) return;

    playTick();

    try {
      const updatedPost = await feedService.toggleLike(postId);
      updateKnownPost(updatedPost);

      if (updatedPost.likedByUser) {
        triggerToast(`Tu as aime la publication de ${target.authorName}`);
      }
    } catch (error) {
      triggerToast(getErrorMessage(error, "Impossible de mettre a jour le like."));
    }
  };

  const handleToggleStar = async (postId: string) => {
    const target = findKnownPost(postId);
    if (!target) return;

    playChime();

    try {
      const updatedPost = await feedService.toggleStar(postId);
      updateKnownPost(updatedPost);
      triggerToast(updatedPost.starredByUser ? "Ajoute aux favoris" : "Retire des favoris");
    } catch (error) {
      triggerToast(getErrorMessage(error, "Impossible de mettre a jour le favori."));
    }
  };

  const handleToggleArchive = async (postId: string) => {
    playChime();

    try {
      const updatedPost = await feedService.toggleArchive(postId);
      setPosts((prev) => updatedPost.archived
        ? prev.filter((post) => post.id !== postId)
        : [updatedPost, ...prev.filter((post) => post.id !== postId)]
      );
      setUserPosts((prev) => updatedPost.archived
        ? prev.filter((post) => post.id !== postId)
        : [updatedPost, ...prev.filter((post) => post.id !== postId)]
      );
      triggerToast(updatedPost.archived ? "Publication archivee." : "Publication restauree.");
    } catch (error) {
      triggerToast(getErrorMessage(error, "Impossible d'archiver."));
    }
  };

  const handleTogglePin = async (postId: string) => {
    const target = findKnownPost(postId);
    if (!target) return;

    playChime();

    try {
      const updatedPost = await feedService.togglePin(postId);
      setPosts((prev) => [updatedPost, ...prev.filter((post) => post.id !== postId)]);
      setUserPosts((prev) => [updatedPost, ...prev.filter((post) => post.id !== postId)]);
      triggerToast(updatedPost.pinned ? "Publication epinglee." : "Publication desenpinglee.");
    } catch (error) {
      triggerToast(getErrorMessage(error, "Impossible d'epingler."));
    }
  };

  const handleDeletePost = async (postId: string, fallbackName?: string) => {
    const target = findKnownPost(postId);
    const name = target?.title || fallbackName || target?.content || "ce post";

    if (!window.confirm(`Supprimer le post "${name}" ?`)) return false;

    playChime();

    try {
      await feedService.deletePost(postId);
      removeKnownPost(postId);
      triggerToast("Publication supprimee.");
      return true;
    } catch (error) {
      triggerToast(getErrorMessage(error, "Impossible de supprimer."));
      return false;
    }
  };

  const loadArchivedPosts = useCallback(async () => {
    try {
      return await feedService.fetchArchivedPosts();
    } catch (error) {
      triggerToast(getErrorMessage(error, "Archive indisponible."));
      return [];
    }
  }, [triggerToast]);

  const handleAddPost = async (title: string, content: string, category: PostCategory, image?: string, images: string[] = []) => {
    try {
      const newPost = await feedService.createRemotePost({ title, content, category, image, images });
      setPosts((prev) => [newPost, ...prev.filter((post) => post.id !== newPost.id)]);
      setUserPosts((prev) => [newPost, ...prev.filter((post) => post.id !== newPost.id)]);
      triggerToast(`Publication ajoutee dans "${category}" !`);
    } catch (error) {
      triggerToast(getErrorMessage(error, "Impossible de publier."));
    }
  };

  const loadCommentsPage = async (postId: string, page = 1) => {
    const requestKey = `${postId}:${page}`;
    if (commentsInFlight.current.has(requestKey)) return;

    commentsInFlight.current.add(requestKey);
    setLoadingComments((prev) => ({ ...prev, [postId]: true }));

    try {
      const result = await feedService.fetchComments(postId, page, 20);

      setPostComments((prev) => ({
        ...prev,
        [postId]: page === 1 ? result.comments : [...(prev[postId] || []), ...result.comments],
      }));
      setCommentPages((prev) => ({ ...prev, [postId]: result.page }));
      setCommentHasMore((prev) => ({ ...prev, [postId]: result.hasMore }));
    } catch (error) {
      triggerToast(getErrorMessage(error, "Impossible de charger les commentaires."));
    } finally {
      commentsInFlight.current.delete(requestKey);
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleToggleComments = (postId: string) => {
    setShowCommentsForPost((prev) => {
      const nextValue = !prev[postId];
      if (nextValue && !commentPages[postId]) {
        void loadCommentsPage(postId, 1);
      }
      return { ...prev, [postId]: nextValue };
    });
  };

  const handleLoadMoreComments = (postId: string) => {
    void loadCommentsPage(postId, (commentPages[postId] || 1) + 1);
  };

  const handleCommentDraftChange = (postId: string, text: string) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: text }));
  };

  const handleAddComment = async (postId: string) => {
    const draft = commentDrafts[postId];
    if (!draft || !draft.trim()) return;

    playChime();

    try {
      const newComment = await feedService.addComment(postId, draft.trim());

      setPostComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p))
      );

      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      triggerToast("Commentaire publie !");
    } catch (error) {
      triggerToast(getErrorMessage(error, "Impossible de publier le commentaire."));
    }
  };

  const searchPosts = useCallback((query: string): Post[] => {
    const lowered = query.trim().toLowerCase();
    if (!lowered) return [];
    return posts.filter(
      (p) =>
        p.content.toLowerCase().includes(lowered) ||
        p.authorName.toLowerCase().includes(lowered) ||
        p.authorUsername.toLowerCase().includes(lowered)
    );
  }, [posts]);

  const resetFeed = () => {
    feedService.clearData();
    setPosts([]);
    setUserPosts([]);
    setPostComments({});
    setCommentDrafts({});
    setShowCommentsForPost({});
    setCommentPages({});
    setCommentHasMore({});
    setLoadingComments({});
    commentsInFlight.current.clear();
  };

  const filteredPosts = posts;

  return {
    posts,
    userPosts,
    homeCategory,
    handleCategoryChange,
    commentDrafts,
    postComments,
    showCommentsForPost,
    commentHasMore,
    loadingComments,
    filteredPosts,
    handleToggleLike,
    handleToggleStar,
    handleToggleArchive,
    handleTogglePin,
    handleDeletePost,
    loadArchivedPosts,
    handleAddPost,
    handleToggleComments,
    handleLoadMoreComments,
    handleCommentDraftChange,
    handleAddComment,
    searchPosts,
    resetFeed,
    updateAuthorAvatar,
  };
}
