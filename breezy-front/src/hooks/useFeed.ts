/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { CommentsByPost, Post, PostCategory, RepliesByComment, UserProfile } from '../types';
import { playTick, playChime } from '../audio';
import { feedService } from '../services/ServiceContainer';
import { getErrorMessage } from '../utils/errors';
import { getT } from './useTranslation';

export function useFeed(
  currentUser: UserProfile,
  triggerToast: (msg: string) => void,
  confirmDelete?: (postId: string, postTitle: string) => Promise<boolean>
) {
  const t = getT(currentUser.language || 'fr');
  const [posts, setPosts] = useState<Post[]>(() => feedService.getPosts());
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [homeCategory, setHomeCategory] = useState<PostCategory>('for-you');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<CommentsByPost>(() => feedService.getComments());
  const [showCommentsForPost, setShowCommentsForPost] = useState<Record<string, boolean>>({});
  const [commentPages, setCommentPages] = useState<Record<string, number>>({});
  const [commentHasMore, setCommentHasMore] = useState<Record<string, boolean>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [commentReplies, setCommentReplies] = useState<RepliesByComment>({});
  const [showRepliesForComment, setShowRepliesForComment] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!currentUser.username) return;

    let cancelled = false;

    async function loadFeed() {
      try {
        const result = await feedService.fetchPosts(homeCategory, 1);

        if (!cancelled) {
          setPosts(result.posts);
          setFeedPage(1);
          setFeedHasMore(result.hasMore);
        }
      } catch (error) {
        if (!cancelled) {
          triggerToast(getErrorMessage(error, t('feed.error_load')));
        }
      }
    }

    loadFeed();

    const interval = setInterval(async () => {
      if (cancelled) return;
      try {
        const result = await feedService.fetchPosts(homeCategory, 1);
        if (cancelled) return;
        setPosts((prev) => {
          const freshMap = new Map(result.posts.map((p) => [p.id, p]));
          // Met à jour les compteurs des posts existants, ajoute les nouveaux en tête
          const updated = prev.map((p) => freshMap.has(p.id) ? freshMap.get(p.id)! : p);
          const newPosts = result.posts.filter((p) => !prev.some((e) => e.id === p.id));
          return [...newPosts, ...updated];
        });
      } catch {
        // silencieux — on garde les posts en cache
      }
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUser.username, homeCategory, triggerToast]);

  const handleLoadMoreFeed = async () => {
    if (!feedHasMore || feedLoadingMore) return;
    setFeedLoadingMore(true);
    try {
      const nextPage = feedPage + 1;
      const result = await feedService.fetchPosts(homeCategory, nextPage);
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        return [...prev, ...result.posts.filter((p) => !existingIds.has(p.id))];
      });
      setFeedPage(nextPage);
      setFeedHasMore(result.hasMore);
    } catch (error) {
      triggerToast(getErrorMessage(error, t('feed.error_load_more')));
    } finally {
      setFeedLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!currentUser.username) return;

    let cancelled = false;

    async function loadUserPosts() {
      try {
        const nextUserPosts = await feedService.fetchUserPosts(currentUser.username);

        if (!cancelled) {
          setUserPosts(nextUserPosts);
        }
      } catch (error) {
        if (!cancelled) {
          triggerToast(getErrorMessage(error, t('feed.error_load_mine')));
        }
      }
    }

    loadUserPosts();

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

  // Polling des commentaires pour les posts dont la section est ouverte (toutes les 20s)
  useEffect(() => {
    const openPostIds = Object.keys(showCommentsForPost).filter((id) => showCommentsForPost[id]);
    if (openPostIds.length === 0) return;

    let cancelled = false;

    const interval = setInterval(() => {
      openPostIds.forEach((postId) => {
        feedService.fetchComments(postId, 1, 20)
          .then((result) => {
            if (cancelled) return;
            setPostComments((prev) => ({ ...prev, [postId]: result.comments }));
            setCommentHasMore((prev) => ({ ...prev, [postId]: result.hasMore }));
            // Met à jour le compteur sur le post avec le total exact
            setPosts((prev) =>
              prev.map((p) => p.id === postId ? { ...p, comments: result.total } : p)
            );
          })
          .catch(() => {});
      });
    }, 20_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [showCommentsForPost]);

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

    // Mise à jour optimiste : bascule immédiatement dans l'UI
    const optimistic = {
      ...target,
      likedByUser: !target.likedByUser,
      likes: target.likedByUser ? Math.max(0, target.likes - 1) : target.likes + 1,
    };
    updateKnownPost(optimistic);

    try {
      const updatedPost = await feedService.toggleLike(postId);
      updateKnownPost(updatedPost);

      if (updatedPost.likedByUser) {
        triggerToast(t('feed.toast_liked', { name: target.authorName }));
      }
    } catch (error) {
      updateKnownPost(target);
      triggerToast(getErrorMessage(error, t('feed.error_like')));
    }
  };

  const handleToggleStar = async (postId: string) => {
    const target = findKnownPost(postId);
    if (!target) return;

    playChime();

    // Mise à jour optimiste
    updateKnownPost({ ...target, starredByUser: !target.starredByUser });

    try {
      const updatedPost = await feedService.toggleStar(postId);
      updateKnownPost(updatedPost);
      triggerToast(updatedPost.starredByUser ? t('feed.toast_starred') : t('feed.toast_unstarred'));
    } catch (error) {
      updateKnownPost(target);
      triggerToast(getErrorMessage(error, t('feed.error_star')));
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
      triggerToast(updatedPost.archived ? t('feed.toast_archived') : t('feed.toast_unarchived'));
    } catch (error) {
      triggerToast(getErrorMessage(error, t('feed.error_archive')));
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
      triggerToast(updatedPost.pinned ? t('feed.toast_pinned') : t('feed.toast_unpinned'));
    } catch (error) {
      triggerToast(getErrorMessage(error, t('feed.error_pin')));
    }
  };

  const handleDeletePost = async (postId: string, fallbackName?: string) => {
    const target = findKnownPost(postId);
    const name = target?.title || fallbackName || target?.content || "ce post";

    const confirmed = confirmDelete
      ? await confirmDelete(postId, name)
      : window.confirm(`Supprimer le post "${name}" ?`);

    if (!confirmed) return false;

    playChime();

    try {
      await feedService.deletePost(postId);
      removeKnownPost(postId);
      triggerToast(t('feed.toast_deleted'));
      return true;
    } catch (error) {
      triggerToast(getErrorMessage(error, t('feed.error_delete')));
      return false;
    }
  };

  const handleEditPost = async (postId: string, title: string, content: string) => {
    try {
      const updatedPost = await feedService.updatePost(postId, title, content);
      updateKnownPost(updatedPost);
      triggerToast(t('feed.toast_edited'));
    } catch (error) {
      triggerToast(getErrorMessage(error, t('feed.error_edit')));
    }
  };

  const loadArchivedPosts = useCallback(async () => {
    try {
      return await feedService.fetchArchivedPosts();
    } catch (error) {
      triggerToast(getErrorMessage(error, t('feed.error_archive_load')));
      return [];
    }
  }, [triggerToast, t]);

  const handleAddPost = async (title: string, content: string, category: PostCategory, image?: string, images: string[] = [], tags: string[] = []) => {
    try {
      const newPost = await feedService.createRemotePost({ title, content, category, image, images, tags });
      setPosts((prev) => [newPost, ...prev.filter((post) => post.id !== newPost.id)]);
      setUserPosts((prev) => [newPost, ...prev.filter((post) => post.id !== newPost.id)]);
      triggerToast(t('feed.toast_created'));
    } catch (error) {
      triggerToast(getErrorMessage(error, t('feed.error_create')));
    }
  };

  const loadCommentsPage = async (postId: string, page = 1) => {
    if (loadingComments[postId]) return;

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
      triggerToast(getErrorMessage(error, t('feed.error_comments')));
    } finally {
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
      triggerToast(t('feed.toast_comment'));
    } catch (error) {
      triggerToast(getErrorMessage(error, t('feed.error_comment')));
    }
  };

  const loadCommentReplies = async (commentId: string) => {
    try {
      const replies = await feedService.fetchCommentReplies(commentId);
      setCommentReplies((prev) => ({ ...prev, [commentId]: replies }));
    } catch (error) {
      triggerToast(getErrorMessage(error, t('feed.error_replies')));
    }
  };

  const handleToggleReplies = (commentId: string) => {
    setShowRepliesForComment((prev) => {
      const next = !prev[commentId];
      if (next && !commentReplies[commentId]) {
        void loadCommentReplies(commentId);
      }
      return { ...prev, [commentId]: next };
    });
  };

  const handleAddReply = async (postId: string, commentId: string, text: string) => {
    if (!text.trim()) return;
    try {
      const newReply = await feedService.addReply(postId, commentId, text.trim());
      setCommentReplies((prev) => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), newReply],
      }));
      setPostComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((c) =>
          c.id === commentId ? { ...c, repliesCount: (c.repliesCount || 0) + 1 } : c
        ),
      }));
      setShowRepliesForComment((prev) => ({ ...prev, [commentId]: true }));
      triggerToast(t('feed.toast_reply'));
    } catch (error) {
      triggerToast(getErrorMessage(error, t('feed.error_reply')));
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
    setFeedPage(1);
    setFeedHasMore(false);
    setPostComments({});
    setCommentDrafts({});
    setShowCommentsForPost({});
    setCommentPages({});
    setCommentHasMore({});
    setLoadingComments({});
    setCommentReplies({});
    setShowRepliesForComment({});
  };

  const filteredPosts = posts;

  return {
    posts,
    userPosts,
    feedHasMore,
    feedLoadingMore,
    handleLoadMoreFeed,
    commentReplies,
    showRepliesForComment,
    handleToggleReplies,
    handleAddReply,
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
    handleEditPost,
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
