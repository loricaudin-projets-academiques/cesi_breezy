/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Comment, CommentsByPost, PaginatedComments, PaginatedPosts, Post, PostCategory, UserProfile } from '../../types';
// RepliesByComment n'est pas utilisé ici mais Comment est suffisant pour les signatures

export interface IFeedService {
  getPosts(): Post[];
  savePosts(posts: Post[]): void;
  getComments(): CommentsByPost;
  saveComments(comments: CommentsByPost): void;
  createPost(author: UserProfile, content: string, category: PostCategory, image?: string, images?: string[], title?: string): Post;
  fetchPosts(category?: PostCategory, page?: number): Promise<PaginatedPosts>;
  fetchAllPostsForSearch(): Promise<Post[]>;
  fetchUserPosts(username: string): Promise<Post[]>;
  fetchArchivedPosts(): Promise<Post[]>;
  fetchComments(postId: string, page?: number, limit?: number): Promise<PaginatedComments>;
  createRemotePost(payload: { title?: string; content: string; category: PostCategory; image?: string; images?: string[]; tags?: string[] }): Promise<Post>;
  searchByTag(tag: string, page?: number): Promise<PaginatedPosts>;
  addComment(postId: string, text: string): Promise<Comment>;
  fetchCommentReplies(commentId: string): Promise<Comment[]>;
  addReply(postId: string, commentId: string, text: string): Promise<Comment>;
  toggleLike(postId: string): Promise<Post>;
  toggleStar(postId: string): Promise<Post>;
  toggleArchive(postId: string): Promise<Post>;
  togglePin(postId: string): Promise<Post>;
  deletePost(postId: string): Promise<void>;
  updatePost(postId: string, title: string, content: string): Promise<Post>;
  clearData(): void;
}
