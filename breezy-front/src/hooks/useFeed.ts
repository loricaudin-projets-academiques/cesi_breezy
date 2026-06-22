/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { CommentsByPost, Post, PostCategory, UserProfile } from '../types';
import { playTick, playChime } from '../audio';
import { feedService } from '../services/ServiceContainer';
import { getErrorMessage } from '../utils/errors';

export function useFeed(
  currentUser: UserProfile,
  triggerToast: (msg: string) => void
) {
  const [posts, setPosts] = useState<Post[]>(() => feedService.getPosts());
  const [homeCategory, setHomeCategory] = useState<PostCategory>('for-you');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<CommentsByPost>(() => feedService.getComments());
  const [showCommentsForPost, setShowCommentsForPost] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!currentUser.username) return;

    let cancelled = false;

    async function loadFeed() {
      try {
        const [nextPosts, nextComments] = await Promise.all([
          feedService.fetchPosts(homeCategory),
          feedService.fetchComments(),
        ]);

        if (!cancelled) {
          setPosts(nextPosts);
          setPostComments(nextComments);
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
  }, [currentUser.username, homeCategory, triggerToast]);

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
  };

  const handleCategoryChange = (cat: PostCategory) => {
    playTick();
    setHomeCategory(cat);
  };

  const handleToggleLike = async (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;

    playTick();

    try {
      const updatedPost = await feedService.toggleLike(postId);
      setPosts((prev) => prev.map((post) => (post.id === postId ? updatedPost : post)));

      if (updatedPost.likedByUser) {
        triggerToast(`Tu as aime la publication de ${target.authorName}`);
      }
    } catch (error) {
      triggerToast(getErrorMessage(error, "Impossible de mettre a jour le like."));
    }
  };

  const handleToggleStar = async (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;

    playChime();

    try {
      const updatedPost = await feedService.toggleStar(postId);
      setPosts((prev) => prev.map((post) => (post.id === postId ? updatedPost : post)));
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
      triggerToast(updatedPost.archived ? "Publication archivee." : "Publication restauree.");
    } catch (error) {
      triggerToast(getErrorMessage(error, "Impossible d'archiver."));
    }
  };

  const handleTogglePin = async (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;

    playChime();

    try {
      const updatedPost = await feedService.togglePin(postId);
      setPosts((prev) => [updatedPost, ...prev.filter((post) => post.id !== postId)]);
      triggerToast(updatedPost.pinned ? "Publication epinglee." : "Publication desenpinglee.");
    } catch (error) {
      triggerToast(getErrorMessage(error, "Impossible d'epingler."));
    }
  };

  const handleDeletePost = async (postId: string, fallbackName?: string) => {
    const target = posts.find((p) => p.id === postId);
    const name = target?.title || fallbackName || target?.content || "ce post";

    if (!window.confirm(`Supprimer le post "${name}" ?`)) return false;

    playChime();

    try {
      await feedService.deletePost(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      triggerToast("Publication supprimee.");
      return true;
    } catch (error) {
      triggerToast(getErrorMessage(error, "Impossible de supprimer."));
      return false;
    }
  };

  const loadArchivedPosts = async () => {
    try {
      return await feedService.fetchArchivedPosts();
    } catch (error) {
      triggerToast(getErrorMessage(error, "Archive indisponible."));
      return [];
    }
  };

  const handleAddPost = async (title: string, content: string, category: PostCategory, image?: string, images: string[] = []) => {
    try {
      const newPost = await feedService.createRemotePost({ title, content, category, image, images });
      setPosts((prev) => [newPost, ...prev.filter((post) => post.id !== newPost.id)]);
      triggerToast(`Publication ajoutee dans "${category}" !`);
    } catch (error) {
      triggerToast(getErrorMessage(error, "Impossible de publier."));
    }
  };

  const handleToggleComments = (postId: string) => {
    setShowCommentsForPost((prev) => ({ ...prev, [postId]: !prev[postId] }));
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
    setPostComments({});
    setCommentDrafts({});
    setShowCommentsForPost({});
  };

  const filteredPosts = posts;

  return {
    posts,
    homeCategory,
    handleCategoryChange,
    commentDrafts,
    postComments,
    showCommentsForPost,
    filteredPosts,
    handleToggleLike,
    handleToggleStar,
    handleToggleArchive,
    handleTogglePin,
    handleDeletePost,
    loadArchivedPosts,
    handleAddPost,
    handleToggleComments,
    handleCommentDraftChange,
    handleAddComment,
    searchPosts,
    resetFeed,
    updateAuthorAvatar,
  };
}
