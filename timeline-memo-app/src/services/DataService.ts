import type { Post } from '../types';

export interface DataService {
  // CRUD操作
  createPost(content: string): Promise<Post>;
  updatePost(id: string, content: string): Promise<Post>;
  deletePost(id: string): Promise<void>;
  getPost(id: string): Promise<Post | null>;
  
  // 一覧・検索
  getAllPosts(): Promise<Post[]>;
  getPostsByDateRange(start: Date, end: Date): Promise<Post[]>;
  
  // リアルタイム更新（フェーズ2）
  subscribeToUpdates(callback: (posts: Post[]) => void): () => void;
}