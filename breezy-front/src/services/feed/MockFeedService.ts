/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IFeedService } from './IFeedService';
import { IStorageProvider } from '../storage/IStorageProvider';
import { Comment, CommentsByPost, Post, PostCategory, UserProfile } from '../../types';
import { INITIAL_POSTS } from '../../mockData';

const KEYS = {
  posts: 'breezy_posts',
  comments: 'breezy_post_comments',
} as const;

export class MockFeedService implements IFeedService {
  constructor(private storage: IStorageProvider) {}

  getPosts(): Post[] {
    return this.storage.get<Post[]>(KEYS.posts) || INITIAL_POSTS;
  }

  savePosts(posts: Post[]): void {
    this.storage.set<Post[]>(KEYS.posts, posts);
  }

  getComments(): CommentsByPost {
    return this.storage.get<CommentsByPost>(KEYS.comments) || {};
  }

  saveComments(comments: CommentsByPost): void {
    this.storage.set<CommentsByPost>(KEYS.comments, comments);
  }

  createPost(author: UserProfile, content: string, category: PostCategory, image?: string, images: string[] = [], title = ""): Post {
    return {
      id: `post-${Date.now()}`,
      authorName: author.name,
      authorUsername: author.username,
      avatar: author.avatar,
      title,
      content,
      timestamp: "A l'instant",
      likes: 0,
      comments: 0,
      shares: 0,
      likedByUser: false,
      starredByUser: false,
      category,
      image,
      images: images.length ? images : image ? [image] : [],
    };
  }

  async fetchPosts(): Promise<Post[]> {
    return this.getPosts();
  }

  async fetchUserPosts(username: string): Promise<Post[]> {
    return this.getPosts().filter((post) => post.authorUsername === username);
  }

  async fetchArchivedPosts(): Promise<Post[]> {
    return this.getPosts().filter((post) => post.archived);
  }

  async fetchComments(): Promise<CommentsByPost> {
    return this.getComments();
  }

  async createRemotePost(payload: { title?: string; content: string; category: PostCategory; image?: string; images?: string[] }): Promise<Post> {
    const author: UserProfile = {
      name: "Breezy",
      username: "@breezy",
      avatar: "",
      bio: "",
      followers: 0,
      following: 0,
      friends: 0,
      note: "",
      isPrivate: false,
      language: "fr",
      notificationsEnabled: true,
      music: { title: "", artist: "", cover: "", isPlaying: false, progressPercent: 0 },
    };
    const post = this.createPost(author, payload.content, payload.category, payload.image, payload.images, payload.title);
    this.savePosts([post, ...this.getPosts()]);
    return post;
  }

  async addComment(postId: string, text: string): Promise<Comment> {
    const comment = {
      author: "Breezy",
      username: "@breezy",
      text,
      time: "A l'instant",
    };
    const comments = this.getComments();
    this.saveComments({ ...comments, [postId]: [...(comments[postId] || []), comment] });
    return comment;
  }

  async toggleLike(postId: string): Promise<Post> {
    const post = this.getPosts().find((item) => item.id === postId);
    if (!post) throw new Error("Post introuvable.");
    const likedByUser = !post.likedByUser;
    const next = { ...post, likedByUser, likes: post.likes + (likedByUser ? 1 : -1) };
    this.savePosts(this.getPosts().map((item) => (item.id === postId ? next : item)));
    return next;
  }

  async toggleStar(postId: string): Promise<Post> {
    const post = this.getPosts().find((item) => item.id === postId);
    if (!post) throw new Error("Post introuvable.");
    const next = { ...post, starredByUser: !post.starredByUser };
    this.savePosts(this.getPosts().map((item) => (item.id === postId ? next : item)));
    return next;
  }

  async toggleArchive(postId: string): Promise<Post> {
    const post = this.getPosts().find((item) => item.id === postId);
    if (!post) throw new Error("Post introuvable.");
    const next = { ...post, archived: !post.archived };
    this.savePosts(this.getPosts().filter((item) => item.id !== postId));
    return next;
  }

  async togglePin(postId: string): Promise<Post> {
    const post = this.getPosts().find((item) => item.id === postId);
    if (!post) throw new Error("Post introuvable.");
    const next = { ...post, pinned: !post.pinned };
    this.savePosts(this.getPosts().map((item) => (item.id === postId ? next : item)));
    return next;
  }

  async deletePost(postId: string): Promise<void> {
    this.savePosts(this.getPosts().filter((item) => item.id !== postId));
  }

  clearData(): void {
    this.storage.remove(KEYS.posts);
    this.storage.remove(KEYS.comments);
  }
}
