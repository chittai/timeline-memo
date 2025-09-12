import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Post } from '../types';

const STORAGE_KEY = 'timeline-memo-posts';

/**
 * シンプルな投稿管理フック（ローカルストレージベース）
 */
export function useSimplePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ローカルストレージから投稿を読み込み
  const loadPosts = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedPosts = JSON.parse(stored);
        // 日付文字列をDateオブジェクトに変換
        const postsWithDates = parsedPosts.map((post: any) => ({
          ...post,
          createdAt: new Date(post.createdAt),
          updatedAt: new Date(post.updatedAt),
        }));
        
        // 作成日時の降順でソート
        postsWithDates.sort((a: Post, b: Post) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        );
        
        setPosts(postsWithDates);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('投稿の読み込みに失敗しました:', err);
      setError('投稿の読み込みに失敗しました');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ローカルストレージに投稿を保存
  const savePosts = useCallback((newPosts: Post[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPosts));
    } catch (err) {
      console.error('投稿の保存に失敗しました:', err);
      throw new Error('投稿の保存に失敗しました');
    }
  }, []);

  // 新しい投稿を作成
  const createPost = useCallback(async (content: string): Promise<Post> => {
    try {
      const now = new Date();
      const newPost: Post = {
        id: uuidv4(),
        content: content.trim(),
        createdAt: now,
        updatedAt: now,
      };

      const updatedPosts = [newPost, ...posts];
      setPosts(updatedPosts);
      savePosts(updatedPosts);
      
      return newPost;
    } catch (err) {
      console.error('投稿の作成に失敗しました:', err);
      throw new Error('投稿の作成に失敗しました');
    }
  }, [posts, savePosts]);

  // 投稿を更新
  const updatePost = useCallback(async (postId: string, content: string): Promise<Post> => {
    try {
      const updatedPosts = posts.map(post => 
        post.id === postId 
          ? { ...post, content: content.trim(), updatedAt: new Date() }
          : post
      );

      setPosts(updatedPosts);
      savePosts(updatedPosts);
      
      const updatedPost = updatedPosts.find(post => post.id === postId);
      if (!updatedPost) {
        throw new Error('投稿が見つかりません');
      }
      
      return updatedPost;
    } catch (err) {
      console.error('投稿の更新に失敗しました:', err);
      throw new Error('投稿の更新に失敗しました');
    }
  }, [posts, savePosts]);

  // 投稿を削除
  const deletePost = useCallback(async (postId: string): Promise<void> => {
    try {
      const updatedPosts = posts.filter(post => post.id !== postId);
      setPosts(updatedPosts);
      savePosts(updatedPosts);
    } catch (err) {
      console.error('投稿の削除に失敗しました:', err);
      throw new Error('投稿の削除に失敗しました');
    }
  }, [posts, savePosts]);

  // 統計情報を計算
  const getStats = useCallback(() => {
    const totalPosts = posts.length;
    const today = new Date();
    const thisMonth = posts.filter(post => 
      post.createdAt.getMonth() === today.getMonth() &&
      post.createdAt.getFullYear() === today.getFullYear()
    ).length;

    // 継続日数の計算（簡易版）
    const uniqueDates = new Set(
      posts.map(post => post.createdAt.toDateString())
    );
    const continuousDays = uniqueDates.size;

    return {
      totalPosts,
      thisMonth,
      continuousDays,
    };
  }, [posts]);

  // 初回読み込み
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return {
    posts,
    isLoading,
    error,
    createPost,
    updatePost,
    deletePost,
    getStats,
    reload: loadPosts,
  };
}