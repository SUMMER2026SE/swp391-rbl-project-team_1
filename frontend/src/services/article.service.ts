import api from "./api";

export interface Article {
  id: string;
  title: string;
  content: string;
  thumbnail: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RealtimeArticle {
  title: string;
  link: string;
  pubDate: string;
  thumbnail: string;
  summary: string;
}

export interface ArticlesResponse {
  message: string;
  count: number;
  data: Article[];
}

export interface RealtimeArticlesResponse {
  message: string;
  count: number;
  data: RealtimeArticle[];
}

export const articleService = {
  async getPublicArticles(): Promise<ArticlesResponse> {
    const response = await api.get<ArticlesResponse>("/articles");
    return response.data;
  },

  async getRealtimeArticles(): Promise<RealtimeArticlesResponse> {
    const response = await api.get<RealtimeArticlesResponse>("/articles/realtime");
    return response.data;
  },
};
