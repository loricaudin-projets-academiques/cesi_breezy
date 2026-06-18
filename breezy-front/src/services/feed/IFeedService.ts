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
  createPost(author: UserProfile, content: string, category: PostCategory, image?: string, video?: string): Post;
  fetchPosts(): Promise<Post[]>;
  fetchComments(postId?: string): Promise<CommentsByPost>;
  createRemotePost(payload: { content: string; category: PostCategory; image?: string; video?: string }): Promise<Post>;
  addComment(postId: string, text: string, video?: string): Promise<Comment>;
  toggleLike(postId: string): Promise<Post>;
  toggleStar(postId: string): Promise<Post>;
  clearData(): void;
}
