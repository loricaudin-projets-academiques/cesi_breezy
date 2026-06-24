/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Les catégories possibles d'un post — réutilisées partout (feed, modal de création, filtres)
export type PostCategory = 'for-you' | 'following' | 'friends';

// Libellés affichés pour chaque catégorie — une seule définition pour toute l'app
export const POST_CATEGORIES: ReadonlyArray<{ key: PostCategory; label: string }> = [
  { key: 'for-you', label: 'For You' },
  { key: 'following', label: 'Following' },
  { key: 'friends', label: 'Friends' },
];

// Représente une publication dans le fil d'actualité
export interface Post {
  id: string;
  authorName: string;
  authorUsername: string;
  avatar: string;
  title?: string;
  content: string;
  timestamp: string;
  createdAt?: string;
  likes: number;
  comments: number;
  shares: number;
  likedByUser: boolean;
  starredByUser: boolean;
  category: PostCategory;
  image?: string; // Photo optionnelle jointe au post
  images?: string[];
  archived?: boolean;
  pinned?: boolean;
  canArchive?: boolean;
  canManage?: boolean;
  tags?: string[];
}

// Un commentaire publié sous un post
export interface Comment {
  id?: string;
  author: string;
  username: string;
  text: string;
  time: string;
  repliesCount?: number;
}

// Tous les commentaires de l'app, rangés par identifiant de post
export type CommentsByPost = Record<string, Comment[]>;

// Réponses à un commentaire, rangées par identifiant de commentaire
export type RepliesByComment = Record<string, Comment[]>;

export interface PaginatedComments {
  comments: Comment[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface PaginatedPosts {
  posts: Post[];
  page: number;
  hasMore: boolean;
}

// Un message échangé dans une conversation privée
export interface MessageItem {
  id: string;
  sender: 'me' | 'them'; // "me" = nous, "them" = notre interlocuteur
  text: string;
  media?: string[];
  time: string;
}

// Tout ce qui concerne une conversation (le contact, les messages, l'état non-lu...)
export interface Conversation {
  id: string;
  name: string;
  username: string;
  avatar: string;
  lastMessage: string;
  unreadCount: number; // Nombre de messages pas encore lus (pour la pastille rouge)
  time: string;
  online: boolean; // Le contact est-il en ligne en ce moment ?
  messages: MessageItem[];
}

// Le profil complet de l'utilisateur connecté
export interface UserProfile {
  name: string;
  email?: string;
  username: string;
  bio: string;
  followers: number;
  following: number;
  friends: number;
  avatar: string;
  note: string;   // La petite phrase d'humeur visible sur le profil
  language: 'fr' | 'en';
  theme: 'dark' | 'light';
  ambientGlow: boolean;
  notificationsEnabled: boolean;
}

// Une personne dans les listes abonnés / abonnements / amis
export interface Follower {
  name: string;
  username: string;
  avatar: string;
  followsMe: boolean;
  followedByMe: boolean;
  isFriend: boolean;
}

export interface AccountNotification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'reply' | 'mention';
  targetType: 'profile' | 'post' | 'comment';
  targetId?: string;
  isRead: boolean;
  createdAt: string;
  text: string;
  metadata?: {
    excerpt?: string;
    postTitle?: string;
  };
  actor: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
}

// Les trois types de statistiques sociales du profil
export type ProfileStatType = 'followers' | 'following' | 'friends';

// Les onglets internes de l'écran de profil
export type ProfileSubTab = 'posts' | ProfileStatType;
