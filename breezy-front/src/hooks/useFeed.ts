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
  const [commentVideoDrafts, setCommentVideoDrafts] = useState<Record<string, string | undefined>>({});
  const [postComments, setPostComments] = useState<CommentsByPost>(() => feedService.getComments());
  const [showCommentsForPost, setShowCommentsForPost] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!currentUser.username) return;

    let cancelled = false;

    async function loadFeed() {
      try {
        const [nextPosts, nextComments] = await Promise.all([
          feedService.fetchPosts(),
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
  }, [currentUser.username, triggerToast]);

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

  const handleAddPost = async (content: string, category: PostCategory, image?: string, video?: string) => {
    try {
      const newPost = await feedService.createRemotePost({ content, category, image, video });
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

  const handleCommentVideoChange = (postId: string, url: string | undefined) => {
    setCommentVideoDrafts((prev) => ({ ...prev, [postId]: url }));
  };

  const handleAddComment = async (postId: string) => {
    const draft = commentDrafts[postId] || '';
    const video = commentVideoDrafts[postId];

    if (!draft.trim() && !video) return;

    playChime();

    try {
      const newComment = await feedService.addComment(postId, draft.trim(), video);

      setPostComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p))
      );

      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      setCommentVideoDrafts((prev) => ({ ...prev, [postId]: undefined }));
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
    setCommentVideoDrafts({});
    setShowCommentsForPost({});
  };

  const filteredPosts = posts.filter((post) => {
    if (homeCategory === 'starred') return post.starredByUser;
    return post.category === homeCategory;
  });

  return {
    posts,
    homeCategory,
    handleCategoryChange,
    commentDrafts,
    commentVideoDrafts,
    postComments,
    showCommentsForPost,
    filteredPosts,
    handleToggleLike,
    handleToggleStar,
    handleAddPost,
    handleToggleComments,
    handleCommentDraftChange,
    handleCommentVideoChange,
    handleAddComment,
    searchPosts,
    resetFeed,
    updateAuthorAvatar,
  };
}
