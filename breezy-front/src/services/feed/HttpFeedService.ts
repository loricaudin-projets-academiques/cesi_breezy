import { api } from "../api";
import { Comment, CommentsByPost, Post, PostCategory } from "../../types";

export class HttpFeedService {
  async fetchPosts(category?: PostCategory): Promise<Post[]> {
    const { data } = await api.get<Post[]>("/feed/posts", {
      params: category ? { category } : undefined,
    });

    return data;
  }

  async fetchComments(postId?: string): Promise<CommentsByPost> {
    const { data } = await api.get<CommentsByPost>("/feed/comments", {
      params: postId ? { postId } : undefined,
    });

    return data;
  }

  async createPost(payload: {
    content: string;
    category: PostCategory;
    image?: string;
  }): Promise<Post> {
    const { data } = await api.post<Post>("/feed/posts", payload);
    return data;
  }

  async addComment(postId: string, text: string): Promise<Comment> {
    const { data } = await api.post<Comment>(`/feed/posts/${postId}/comments`, { text });
    return data;
  }

  async toggleLike(postId: string): Promise<Post> {
    const { data } = await api.post<Post>(`/feed/posts/${postId}/like`);
    return data;
  }

  async toggleStar(postId: string): Promise<Post> {
    const { data } = await api.post<Post>(`/feed/posts/${postId}/star`);
    return data;
  }
}
