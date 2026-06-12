/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IFeedService } from './IFeedService';
import { IStorageProvider } from '../storage/IStorageProvider';
import { CommentsByPost, Post, PostCategory, UserProfile } from '../../types';
import { INITIAL_POSTS } from '../../mockData';

// Clés de stockage propres au feed — encapsulées dans ce service
const KEYS = {
  posts: 'breezy_posts',
  comments: 'breezy_post_comments',
} as const;

// Version locale du service de feed — tout passe par le localStorage
// Très pratique pour travailler sans back-end
export class MockFeedService implements IFeedService {
  constructor(private storage: IStorageProvider) {}

  // Charge les posts sauvegardés, ou retourne une liste vide si c'est la première visite
  getPosts(): Post[] {
    return this.storage.get<Post[]>(KEYS.posts) || INITIAL_POSTS;
  }

  // Met à jour la liste des posts dans la mémoire du navigateur
  savePosts(posts: Post[]): void {
    this.storage.set<Post[]>(KEYS.posts, posts);
  }

  // Récupère tous les commentaires, organisés par identifiant de post
  getComments(): CommentsByPost {
    return this.storage.get<CommentsByPost>(KEYS.comments) || {};
  }

  // Sauvegarde les commentaires après chaque ajout
  saveComments(comments: CommentsByPost): void {
    this.storage.set<CommentsByPost>(KEYS.comments, comments);
  }

  // Fabrique un nouveau post prêt à être publié
  createPost(author: UserProfile, content: string, category: PostCategory, image?: string): Post {
    return {
      id: `post-${Date.now()}`,
      authorName: author.name,
      authorUsername: author.username,
      avatar: author.avatar,
      content,
      timestamp: "À l'instant",
      likes: 0,
      comments: 0,
      shares: 0,
      likedByUser: false,
      starredByUser: false,
      category,
      image
    };
  }

  // Efface posts et commentaires — utilisé à la déconnexion
  clearData(): void {
    this.storage.remove(KEYS.posts);
    this.storage.remove(KEYS.comments);
  }
}
