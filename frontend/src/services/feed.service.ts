import { API_URL } from "../constants";

export interface FeedPost {
  id: string;
  type: string;
  title: string;
  body: string;
  imageUrl?: string;
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  createdAt: string;
  user: {
    name: string;
    role: string;
  };
}

export interface FeedComment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    name: string;
  };
}

export interface LikeResult {
  liked: boolean;
  likesCount: number;
}

export const feedService = {
  async getAll(token: string): Promise<FeedPost[]> {
    const res = await fetch(`${API_URL}/feed`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || "Failed to fetch feed posts");
    }
    return json.data as FeedPost[];
  },

  async create(
    data: { type: string; title: string; body: string; imageUrl?: string },
    token: string
  ): Promise<FeedPost> {
    const res = await fetch(`${API_URL}/feed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || "Failed to create post");
    }
    return json.data as FeedPost;
  },

  async like(postId: string, token: string): Promise<LikeResult> {
    const res = await fetch(`${API_URL}/feed/${postId}/like`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || "Failed to like post");
    }
    return json.data as LikeResult;
  },

  async getComments(postId: string, token: string): Promise<FeedComment[]> {
    const res = await fetch(`${API_URL}/feed/${postId}/comments`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || "Failed to fetch comments");
    }
    return json.data as FeedComment[];
  },

  async addComment(
    postId: string,
    text: string,
    token: string
  ): Promise<FeedComment> {
    const res = await fetch(`${API_URL}/feed/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || "Failed to add comment");
    }
    return json.data as FeedComment;
  },
};