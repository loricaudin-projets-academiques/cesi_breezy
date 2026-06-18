import { api } from "../api";
import { IStorageProvider } from "../storage/IStorageProvider";
import { IFeedService } from "./IFeedService";
import { Comment, CommentsByPost, Post, PostCategory, UserProfile } from "../../types";

const KEYS = {
  posts: "breezy_posts",
  comments: "breezy_post_comments",
} as const;

export class HttpFeedService implements IFeedService {
  constructor(private storage: IStorageProvider) {}

  getPosts(): Post[] {
    return this.storage.get<Post[]>(KEYS.posts) || [];
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

  createPost(author: UserProfile, content: string, category: PostCategory, image?: string, video?: string): Post {
    return {
      id: `post-${Date.now()}`,
      authorName: author.name,
      authorUsername: author.username,
      avatar: author.avatar,
      content,
      timestamp: "A l'instant",
      likes: 0,
      comments: 0,
      shares: 0,
      likedByUser: false,
      starredByUser: false,
      category,
      image,
      video,
    };
  }

  async fetchPosts(): Promise<Post[]> {
    const { data } = await api.get<Post[]>("/feed/posts");
    this.savePosts(data);
    return data;
  }

  async fetchComments(postId?: string): Promise<CommentsByPost> {
    const { data } = await api.get<CommentsByPost>("/feed/comments", {
      params: postId ? { postId } : undefined,
    });

    const nextComments = postId ? { ...this.getComments(), ...data } : data;
    this.saveComments(nextComments);
    return nextComments;
  }

  async createRemotePost(payload: {
    content: string;
    category: PostCategory;
    image?: string;
    video?: string;
  }): Promise<Post> {
    const { data } = await api.post<Post>("/feed/posts", payload);
    this.savePosts([data, ...this.getPosts().filter((post) => post.id !== data.id)]);
    return data;
  }

  async addComment(postId: string, text: string, video?: string): Promise<Comment> {
    const { data } = await api.post<Comment>(`/feed/posts/${postId}/comments`, { text, video });
    const comments = this.getComments();
    this.saveComments({
      ...comments,
      [postId]: [...(comments[postId] || []), data],
    });
    return data;
  }

  async toggleLike(postId: string): Promise<Post> {
    const { data } = await api.post<Post>(`/feed/posts/${postId}/like`);
    this.savePosts(this.getPosts().map((post) => (post.id === data.id ? data : post)));
    return data;
  }

  async toggleStar(postId: string): Promise<Post> {
    const { data } = await api.post<Post>(`/feed/posts/${postId}/star`);
    this.savePosts(this.getPosts().map((post) => (post.id === data.id ? data : post)));
    return data;
  }

  clearData(): void {
    this.storage.remove(KEYS.posts);
    this.storage.remove(KEYS.comments);
  }
}
