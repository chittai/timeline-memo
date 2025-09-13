import { useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useErrorHandler } from './useErrorHandler';
import type { DataService, Post } from '../types';
import { IndexedDBService } from '../services/IndexedDBService';

// データサービスのインスタンス（将来的にはDIで注入可能にする）
const dataService: DataService = new IndexedDBService();

/**
 * 投稿データ操作のためのカスタムフック
 * データの取得、作成、更新、削除を抽象化
 */
export function usePosts() {
  const { state, dispatch } = useAppContext();
  const { executeAsync } = useErrorHandler();

  // 全投稿の読み込み
  const loadPosts = useCallback(async () => {
    const posts = await executeAsync(
      () => dataService.getAllPosts(),
      {
        loadingMessage: '投稿を読み込んでいます...',
        errorTitle: '投稿の読み込みに失敗しました',
        context: 'loadPosts'
      }
    );
    
    if (posts) {
      dispatch({ type: 'LOAD_POSTS', payload: posts });
    }
  }, [dispatch, executeAsync]);

  // 新規投稿の作成
  const createPost = useCallback(async (content: string): Promise<Post | null> => {
    console.log('usePosts.createPost 開始:', content);
    const newPost = await executeAsync(
      () => {
        console.log('dataService.createPost 呼び出し:', content);
        return dataService.createPost(content);
      },
      {
        loadingMessage: '投稿を作成しています...',
        errorTitle: '投稿の作成に失敗しました',
        context: 'createPost'
      }
    );
    
    console.log('executeAsync 結果:', newPost);
    if (newPost) {
      console.log('dispatch ADD_POST:', newPost);
      dispatch({ type: 'ADD_POST', payload: newPost });
    }
    
    return newPost;
  }, [dispatch, executeAsync]);

  // 投稿の更新
  const updatePost = useCallback(async (id: string, content: string): Promise<Post | null> => {
    const updatedPost = await executeAsync(
      () => dataService.updatePost(id, content),
      {
        loadingMessage: '投稿を更新しています...',
        errorTitle: '投稿の更新に失敗しました',
        context: 'updatePost'
      }
    );
    
    if (updatedPost) {
      dispatch({ type: 'UPDATE_POST', payload: updatedPost });
    }
    
    return updatedPost;
  }, [dispatch, executeAsync]);

  // 投稿の削除
  const deletePost = useCallback(async (id: string): Promise<boolean> => {
    const result = await executeAsync(
      () => dataService.deletePost(id),
      {
        loadingMessage: '投稿を削除しています...',
        errorTitle: '投稿の削除に失敗しました',
        context: 'deletePost'
      }
    );
    
    if (result !== null) {
      dispatch({ type: 'DELETE_POST', payload: id });
      return true;
    }
    
    return false;
  }, [dispatch, executeAsync]);

  // 投稿の選択
  const selectPost = useCallback((postId: string | null) => {
    dispatch({ type: 'SELECT_POST', payload: postId });
  }, [dispatch]);

  // エラーのクリア
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, [dispatch]);

  // 特定の投稿を取得
  const getPost = useCallback(async (id: string): Promise<Post | null> => {
    try {
      return await dataService.getPost(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '投稿の取得に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return null;
    }
  }, [dispatch]);

  // 日付範囲で投稿を取得
  const getPostsByDateRange = useCallback(async (start: Date, end: Date): Promise<Post[]> => {
    try {
      return await dataService.getPostsByDateRange(start, end);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '投稿の取得に失敗しました';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return [];
    }
  }, [dispatch]);

  // アプリ初期化時に投稿を読み込み
  useEffect(() => {
    console.log('usePosts: 初期化開始');
    loadPosts();
  }, [loadPosts]);

  return {
    // 状態
    posts: state.posts,
    selectedPostId: state.selectedPostId,
    isLoading: state.loading.isLoading,
    error: state.error,
    
    // アクション
    loadPosts,
    createPost,
    updatePost,
    deletePost,
    selectPost,
    clearError,
    getPost,
    getPostsByDateRange
  };
}