/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Les catégories possibles d'un post — réutilisées partout (feed, modal de création, filtres)
export type PostCategory = 'for-you' | 'following' | 'friends' | 'starred';

// Libellés affichés pour chaque catégorie — une seule définition pour toute l'app
export const POST_CATEGORIES: ReadonlyArray<{ key: PostCategory; label: string }> = [
  { key: 'for-you', label: 'For You' },
  { key: 'following', label: 'Following' },
  { key: 'friends', label: 'Friends' },
  { key: 'starred', label: 'Starred' },
];

// Représente une publication dans le fil d'actualité
export interface Post {
  id: string;
  authorName: string;
  authorUsername: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  likedByUser: boolean;
  starredByUser: boolean;
  category: PostCategory;
  image?: string; // Photo optionnelle jointe au post
}

// Un commentaire publié sous un post
export interface Comment {
  author: string;
  username: string;
  text: string;
  time: string;
}

// Tous les commentaires de l'app, rangés par identifiant de post
export type CommentsByPost = Record<string, Comment[]>;

// Un message échangé dans une conversation privée
export interface MessageItem {
  id: string;
  sender: 'me' | 'them'; // "me" = nous, "them" = notre interlocuteur
  text: string;
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

// Ce qu'on affiche dans le widget musical du profil
export interface MusicState {
  title: string;
  artist: string;
  cover: string;
  isPlaying: boolean;
  progressPercent: number; // Position dans la chanson, de 0 à 100
}

// Le profil complet de l'utilisateur connecté
export interface UserProfile {
  name: string;
  username: string;
  bio: string;
  followers: number;
  following: number;
  friends: number;
  avatar: string;
  note: string;   // La petite phrase d'humeur visible sur le profil
  music: MusicState; // La musique qu'il écoute en ce moment
}

// Une personne dans les listes abonnés / abonnements / amis
export interface Follower {
  name: string;
  username: string;
  avatar: string;
  followsMe: boolean;
  followedByMe: boolean;
}

// Les trois types de statistiques sociales du profil
export type ProfileStatType = 'followers' | 'following' | 'friends';

// Les onglets internes de l'écran de profil
export type ProfileSubTab = 'posts' | ProfileStatType;
