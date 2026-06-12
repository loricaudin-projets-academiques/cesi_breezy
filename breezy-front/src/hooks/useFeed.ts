/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Comment, CommentsByPost, Post, PostCategory, UserProfile } from '../types';
import { playTick, playChime } from '../audio';
import { feedService } from '../services/ServiceContainer';

// Centralise toute la logique du fil d'actualité : chargement, likes, commentaires, publication...
// L'état interne (setters React) ne sort pas du hook — on n'expose que des actions nommées.
export function useFeed(
  currentUser: UserProfile,
  triggerToast: (msg: string) => void
) {
  // Liste globale de tous les posts
  const [posts, setPosts] = useState<Post[]>(() => {
    return feedService.getPosts();
  });

  // Onglet actif dans le fil (Pour toi, Abonnements...)
  const [homeCategory, setHomeCategory] = useState<PostCategory>('for-you');

  // On garde en mémoire ce que l'utilisateur est en train d'écrire pour chaque post
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  // Les commentaires déjà publiés, rangés par identifiant de post
  const [postComments, setPostComments] = useState<CommentsByPost>(() => {
    return feedService.getComments();
  });

  // Suivi de quels posts affichent leur section de commentaires
  const [showCommentsForPost, setShowCommentsForPost] = useState<Record<string, boolean>>({});

  // Sauvegarde automatique à chaque modification des posts
  useEffect(() => {
    feedService.savePosts(posts);
  }, [posts]);

  // Pareil pour les commentaires
  useEffect(() => {
    feedService.saveComments(postComments);
  }, [postComments]);

  // Quand l'utilisateur change d'avatar, on met à jour tous ses posts existants
  const updateAuthorAvatar = (avatarUrl: string) => {
    setPosts((pList) =>
      pList.map((p) => (p.authorUsername === currentUser.username ? { ...p, avatar: avatarUrl } : p))
    );
  };

  // Changement d'onglet (avec un petit son de clic)
  const handleCategoryChange = (cat: PostCategory) => {
    playTick();
    setHomeCategory(cat);
  };

  // Bascule le like sur un post — ajoute ou retire selon l'état actuel
  const handleToggleLike = (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;

    playTick();
    const liked = !target.likedByUser;
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, likedByUser: liked, likes: post.likes + (liked ? 1 : -1) }
          : post
      )
    );

    if (liked) {
      triggerToast(`Tu as aimé la publication de ${target.authorName}`);
    }
  };

  // Ajoute ou retire un post des favoris (étoile)
  const handleToggleStar = (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;

    playChime();
    const starred = !target.starredByUser;
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, starredByUser: starred } : post))
    );

    triggerToast(starred ? "Ajouté aux favoris ✨" : "Retiré des favoris");
  };

  // Publie un nouveau post dans le fil — c'est le service qui sait le construire
  const handleAddPost = (content: string, category: PostCategory, image?: string) => {
    const newPost = feedService.createPost(currentUser, content, category, image);
    setPosts((prev) => [newPost, ...prev]);
    triggerToast(`Publication ajoutée dans "${category}" !`);
  };

  // Déplie ou replie la section commentaires d'un post
  const handleToggleComments = (postId: string) => {
    setShowCommentsForPost((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Met à jour le brouillon de commentaire d'un post
  const handleCommentDraftChange = (postId: string, text: string) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: text }));
  };

  // Envoie un commentaire sur un post (depuis le brouillon en cours)
  const handleAddComment = (postId: string) => {
    const draft = commentDrafts[postId];
    if (!draft || !draft.trim()) return;

    playChime();
    const newComment: Comment = {
      author: currentUser.name,
      username: currentUser.username,
      text: draft.trim(),
      time: "À l'instant"
    };

    setPostComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment]
    }));

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p))
    );

    // On vide le champ texte une fois le commentaire posté
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    triggerToast("Commentaire publié !");
  };

  // Recherche en temps réel — on filtre dans le contenu, le nom et le pseudo
  const searchPosts = (query: string): Post[] => {
    const lowered = query.trim().toLowerCase();
    if (!lowered) return [];
    return posts.filter(
      (p) =>
        p.content.toLowerCase().includes(lowered) ||
        p.authorName.toLowerCase().includes(lowered) ||
        p.authorUsername.toLowerCase().includes(lowered)
    );
  };

  // Remet le feed à zéro et efface ses données persistées — utilisé à la déconnexion
  const resetFeed = () => {
    feedService.clearData();
    setPosts([]);
    setPostComments({});
    setCommentDrafts({});
    setShowCommentsForPost({});
  };

  // Ne montre que les posts qui correspondent à l'onglet sélectionné
  const filteredPosts = posts.filter((post) => post.category === homeCategory);

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
    handleAddPost,
    handleToggleComments,
    handleCommentDraftChange,
    handleAddComment,
    searchPosts,
    resetFeed,
    updateAuthorAvatar
  };
}
