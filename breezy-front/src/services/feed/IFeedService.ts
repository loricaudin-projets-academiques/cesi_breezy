/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommentsByPost, Post, PostCategory, UserProfile } from '../../types';

// Ce que doit savoir faire n'importe quel service de feed :
// gérer les posts et leurs commentaires, et savoir construire un nouveau post.
export interface IFeedService {
  getPosts(): Post[];
  savePosts(posts: Post[]): void;
  getComments(): CommentsByPost;
  saveComments(comments: CommentsByPost): void;
  // C'est le service qui sait comment fabriquer un post valide (id, timestamp, compteurs...)
  createPost(author: UserProfile, content: string, category: PostCategory, image?: string): Post;
  // Efface toutes les données du feed — appelé à la déconnexion
  clearData(): void;
}
