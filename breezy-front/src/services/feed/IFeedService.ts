/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Comment, CommentsByPost, Post, PostCategory, UserProfile } from '../../types';

export interface IFeedService {
  getPosts(): Post[];
  savePosts(posts: Post[]): void;
  getComments(): CommentsByPost;
  saveComments(comments: CommentsByPost): void;
  createPost(author: UserProfile, content: string, category: PostCategory, image?: string, images?: string[], title?: string): Post;
  fetchPosts(category?: PostCategory): Promise<Post[]>;
  fetchUserPosts(username: string): Promise<Post[]>;
  fetchArchivedPosts(): Promise<Post[]>;
  fetchComments(postId?: string): Promise<CommentsByPost>;
  createRemotePost(payload: { title?: string; content: string; category: PostCategory; image?: string; images?: string[] }): Promise<Post>;
  addComment(postId: string, text: string): Promise<Comment>;
  toggleLike(postId: string): Promise<Post>;
  toggleStar(postId: string): Promise<Post>;
  toggleArchive(postId: string): Promise<Post>;
  togglePin(postId: string): Promise<Post>;
  deletePost(postId: string): Promise<void>;
  clearData(): void;
}
