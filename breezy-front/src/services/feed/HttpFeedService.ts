import { api } from "../api";
import { IStorageProvider } from "../storage/IStorageProvider";
import { IFeedService } from "./IFeedService";
import { Comment, CommentsByPost, PaginatedComments, Post, PostCategory, UserProfile } from "../../types";

const KEYS = {
  posts: "breezy_posts",
  comments: "breezy_post_comments",
} as const;

export class HttpFeedService implements IFeedService {
  private postsRequests = new Map<string, Promise<Post[]>>();

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

  async fetchPosts(category?: PostCategory): Promise<Post[]> {
    const requestKey = category || "for-you";
    const existingRequest = this.postsRequests.get(requestKey);
    if (existingRequest) return existingRequest;

    const request = api.get<Post[]>("/feed/posts", {
      params: {
        ...(category && category !== "for-you" ? { category } : {}),
        page: 1,
        limit: 20,
      },
    }).then(({ data }) => {
      this.savePosts(data);
      return data;
    }).finally(() => {
      this.postsRequests.delete(requestKey);
    });

    this.postsRequests.set(requestKey, request);
    return request;
  }

  async fetchUserPosts(username: string): Promise<Post[]> {
    const requestKey = `user:${username}`;
    const existingRequest = this.postsRequests.get(requestKey);
    if (existingRequest) return existingRequest;

    const request = api.get<Post[]>(`/feed/users/${encodeURIComponent(username)}/posts`, {
      params: { page: 1, limit: 20 },
    }).then(({ data }) => data).finally(() => {
      this.postsRequests.delete(requestKey);
    });

    this.postsRequests.set(requestKey, request);
    return request;
  }

  async fetchArchivedPosts(): Promise<Post[]> {
    const requestKey = "archive";
    const existingRequest = this.postsRequests.get(requestKey);
    if (existingRequest) return existingRequest;

    const request = api.get<Post[]>("/feed/archive/posts", {
      params: { page: 1, limit: 20 },
    }).then(({ data }) => data).finally(() => {
      this.postsRequests.delete(requestKey);
    });

    this.postsRequests.set(requestKey, request);
    return request;
  }

  async fetchComments(postId: string, page = 1, limit = 20): Promise<PaginatedComments> {
    const { data } = await api.get<PaginatedComments>("/feed/comments", {
      params: { postId, page, limit },
    });

    const nextComments = {
      ...this.getComments(),
      [postId]: page === 1 ? data.comments : [...(this.getComments()[postId] || []), ...data.comments],
    };
    this.saveComments(nextComments);
    return data;
  }

  async createRemotePost(payload: {
    title?: string;
    content: string;
    category: PostCategory;
    image?: string;
    images?: string[];
  }): Promise<Post> {
    const { data } = await api.post<Post>("/feed/posts", payload);
    this.savePosts([data, ...this.getPosts().filter((post) => post.id !== data.id)]);
    return data;
  }

  async addComment(postId: string, text: string): Promise<Comment> {
    const { data } = await api.post<Comment>(`/feed/posts/${postId}/comments`, { text });
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

  async toggleArchive(postId: string): Promise<Post> {
    const { data } = await api.post<Post>(`/feed/posts/${postId}/archive`);
    this.savePosts(data.archived
      ? this.getPosts().filter((post) => post.id !== data.id)
      : [data, ...this.getPosts().filter((post) => post.id !== data.id)]
    );
    return data;
  }

  async togglePin(postId: string): Promise<Post> {
    const { data } = await api.post<Post>(`/feed/posts/${postId}/pin`);
    this.savePosts(this.getPosts().map((post) => (post.id === data.id ? data : post)));
    return data;
  }

  async deletePost(postId: string): Promise<void> {
    await api.delete(`/feed/posts/${postId}`);
    this.savePosts(this.getPosts().filter((post) => post.id !== postId));
  }

  clearData(): void {
    this.storage.remove(KEYS.posts);
    this.storage.remove(KEYS.comments);
  }
}
