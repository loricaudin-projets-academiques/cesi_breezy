/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Post, Conversation, UserProfile, Follower } from './types';

// Profil vide qu'on utilise tant que personne n'est connecté
export const INITIAL_USER: UserProfile = {
  name: "",
  username: "",
  bio: "",
  followers: 0,
  following: 0,
  friends: 0,
  avatar: "",
  note: "",
  music: {
    title: "",
    artist: "",
    cover: "",
    isPlaying: false,
    progressPercent: 0
  }
};

// Aucun post au démarrage — l'utilisateur crée les siens
export const INITIAL_POSTS: Post[] = [];

// Aucune conversation au démarrage non plus
export const INITIAL_CONVERSATIONS: Conversation[] = [];

// Liste simulée des abonnés/abonnements — sera alimentée par le back-end plus tard
export const INITIAL_FOLLOWERS: Follower[] = [];
