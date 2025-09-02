import { renderHook, act } from '@testing-library/react';
import { useAppReducer } from '../useAppReducer';
import type { Post } from '../../types';

// テスト用のモックデータ
const mockPost: Post = {
  id: 'test-id-1',
  content: 'テスト投稿',
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  tags: ['test']
};

const mockPost2: Post = {
  id: 'test-id-2',
  content: 'テスト投稿2',
  createdAt: new Date('2024-01-01T11:00:00Z'),
  updatedAt: new Date('2024-01-01T11:00:00Z')
};

describe('useAppReducer', () => {
  test('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useAppReducer());
    
    expect(result.current.state).toEqual({
      posts: [],
      selectedPostId: null,
      highlightedPostIds: [],
      loading: { isLoading: false },
      error: null,
      toasts: [],
      viewMode: 'timeline'
    });
  });

  test('LOAD_POSTS アクションで投稿一覧が設定される', () => {
    const { result } = renderHook(() => useAppReducer());
    
    act(() => {
      result.current.dispatch({
        type: 'LOAD_POSTS',
        payload: [mockPost, mockPost2]
      });
    });

    expect(result.current.state.posts).toEqual([mockPost, mockPost2]);
    expect(result.current.state.loading.isLoading).toBe(false);
    expect(result.current.state.error).toBeNull();
  });

  test('ADD_POST アクションで新しい投稿が先頭に追加される', () => {
    const { result } = renderHook(() => useAppReducer());
    
    // 既存の投稿を設定
    act(() => {
      result.current.dispatch({
        type: 'LOAD_POSTS',
        payload: [mockPost2]
      });
    });

    // 新しい投稿を追加
    act(() => {
      result.current.dispatch({
        type: 'ADD_POST',
        payload: mockPost
      });
    });

    expect(result.current.state.posts).toEqual([mockPost, mockPost2]);
    expect(result.current.state.error).toBeNull();
  });

  test('UPDATE_POST アクションで投稿が更新される', () => {
    const { result } = renderHook(() => useAppReducer());
    
    // 既存の投稿を設定
    act(() => {
      result.current.dispatch({
        type: 'LOAD_POSTS',
        payload: [mockPost, mockPost2]
      });
    });

    const updatedPost = {
      ...mockPost,
      content: '更新されたテスト投稿',
      updatedAt: new Date('2024-01-01T12:00:00Z')
    };

    // 投稿を更新
    act(() => {
      result.current.dispatch({
        type: 'UPDATE_POST',
        payload: updatedPost
      });
    });

    expect(result.current.state.posts[0]).toEqual(updatedPost);
    expect(result.current.state.posts[1]).toEqual(mockPost2);
    expect(result.current.state.error).toBeNull();
  });

  test('DELETE_POST アクションで投稿が削除される', () => {
    const { result } = renderHook(() => useAppReducer());
    
    // 既存の投稿を設定
    act(() => {
      result.current.dispatch({
        type: 'LOAD_POSTS',
        payload: [mockPost, mockPost2]
      });
    });

    // 投稿を削除
    act(() => {
      result.current.dispatch({
        type: 'DELETE_POST',
        payload: mockPost.id
      });
    });

    expect(result.current.state.posts).toEqual([mockPost2]);
    expect(result.current.state.error).toBeNull();
  });

  test('DELETE_POST アクションで選択中の投稿が削除された場合、選択が解除される', () => {
    const { result } = renderHook(() => useAppReducer());
    
    // 既存の投稿を設定し、選択状態にする
    act(() => {
      result.current.dispatch({
        type: 'LOAD_POSTS',
        payload: [mockPost, mockPost2]
      });
      result.current.dispatch({
        type: 'SELECT_POST',
        payload: mockPost.id
      });
    });

    expect(result.current.state.selectedPostId).toBe(mockPost.id);

    // 選択中の投稿を削除
    act(() => {
      result.current.dispatch({
        type: 'DELETE_POST',
        payload: mockPost.id
      });
    });

    expect(result.current.state.selectedPostId).toBeNull();
  });

  test('SELECT_POST アクションで投稿が選択される', () => {
    const { result } = renderHook(() => useAppReducer());
    
    act(() => {
      result.current.dispatch({
        type: 'SELECT_POST',
        payload: mockPost.id
      });
    });

    expect(result.current.state.selectedPostId).toBe(mockPost.id);
  });

  test('SET_LOADING アクションでローディング状態が設定される', () => {
    const { result } = renderHook(() => useAppReducer());
    
    act(() => {
      result.current.dispatch({
        type: 'SET_LOADING',
        payload: { isLoading: true, operation: 'テスト処理' }
      });
    });

    expect(result.current.state.loading.isLoading).toBe(true);
    expect(result.current.state.loading.operation).toBe('テスト処理');
  });

  test('SET_ERROR アクションでエラー状態が設定され、ローディングが解除される', () => {
    const { result } = renderHook(() => useAppReducer());
    
    // ローディング状態を設定
    act(() => {
      result.current.dispatch({
        type: 'SET_LOADING',
        payload: { isLoading: true }
      });
    });

    // エラーを設定
    act(() => {
      result.current.dispatch({
        type: 'SET_ERROR',
        payload: 'テストエラー'
      });
    });

    expect(result.current.state.error).toBe('テストエラー');
    expect(result.current.state.loading.isLoading).toBe(false);
  });

  test('CLEAR_ERROR アクションでエラー状態がクリアされる', () => {
    const { result } = renderHook(() => useAppReducer());
    
    // エラーを設定
    act(() => {
      result.current.dispatch({
        type: 'SET_ERROR',
        payload: 'テストエラー'
      });
    });

    expect(result.current.state.error).toBe('テストエラー');

    // エラーをクリア
    act(() => {
      result.current.dispatch({
        type: 'CLEAR_ERROR'
      });
    });

    expect(result.current.state.error).toBeNull();
  });

  test('HIGHLIGHT_POST アクションで投稿がハイライトされる', () => {
    const { result } = renderHook(() => useAppReducer());
    
    act(() => {
      result.current.dispatch({
        type: 'HIGHLIGHT_POST',
        payload: mockPost.id
      });
    });

    expect(result.current.state.highlightedPostIds).toContain(mockPost.id);
  });

  test('CLEAR_HIGHLIGHT アクションでハイライトがクリアされる', () => {
    const { result } = renderHook(() => useAppReducer());
    
    // ハイライトを設定
    act(() => {
      result.current.dispatch({
        type: 'HIGHLIGHT_POST',
        payload: mockPost.id
      });
    });

    expect(result.current.state.highlightedPostIds).toContain(mockPost.id);

    // ハイライトをクリア
    act(() => {
      result.current.dispatch({
        type: 'CLEAR_HIGHLIGHT'
      });
    });

    expect(result.current.state.highlightedPostIds).toEqual([]);
  });

  test('ADD_TOAST アクションでトーストが追加される', () => {
    const { result } = renderHook(() => useAppReducer());
    
    const toast = {
      id: 'toast-1',
      message: 'テストメッセージ',
      type: 'success' as const,
      duration: 3000
    };

    act(() => {
      result.current.dispatch({
        type: 'ADD_TOAST',
        payload: toast
      });
    });

    expect(result.current.state.toasts).toContain(toast);
  });

  test('REMOVE_TOAST アクションでトーストが削除される', () => {
    const { result } = renderHook(() => useAppReducer());
    
    const toast = {
      id: 'toast-1',
      message: 'テストメッセージ',
      type: 'success' as const,
      duration: 3000
    };

    // トーストを追加
    act(() => {
      result.current.dispatch({
        type: 'ADD_TOAST',
        payload: toast
      });
    });

    expect(result.current.state.toasts).toContain(toast);

    // トーストを削除
    act(() => {
      result.current.dispatch({
        type: 'REMOVE_TOAST',
        payload: toast.id
      });
    });

    expect(result.current.state.toasts).not.toContain(toast);
  });

  test('SET_VIEW_MODE アクションで表示モードが変更される', () => {
    const { result } = renderHook(() => useAppReducer());
    
    expect(result.current.state.viewMode).toBe('timeline');

    act(() => {
      result.current.dispatch({
        type: 'SET_VIEW_MODE',
        payload: 'list'
      });
    });

    expect(result.current.state.viewMode).toBe('list');
  });

  test('UPDATE_POST アクションで存在しない投稿を更新しようとした場合、何も変更されない', () => {
    const { result } = renderHook(() => useAppReducer());
    
    // 既存の投稿を設定
    act(() => {
      result.current.dispatch({
        type: 'LOAD_POSTS',
        payload: [mockPost]
      });
    });

    const nonExistentPost = {
      ...mockPost2,
      content: '存在しない投稿の更新'
    };

    // 存在しない投稿を更新
    act(() => {
      result.current.dispatch({
        type: 'UPDATE_POST',
        payload: nonExistentPost
      });
    });

    expect(result.current.state.posts).toEqual([mockPost]);
  });

  test('DELETE_POST アクションで存在しない投稿を削除しようとした場合、何も変更されない', () => {
    const { result } = renderHook(() => useAppReducer());
    
    // 既存の投稿を設定
    act(() => {
      result.current.dispatch({
        type: 'LOAD_POSTS',
        payload: [mockPost]
      });
    });

    // 存在しない投稿を削除
    act(() => {
      result.current.dispatch({
        type: 'DELETE_POST',
        payload: 'non-existent-id'
      });
    });

    expect(result.current.state.posts).toEqual([mockPost]);
  });

  test('複数のアクションが連続して正しく動作する', () => {
    const { result } = renderHook(() => useAppReducer());
    
    // 投稿を読み込み
    act(() => {
      result.current.dispatch({
        type: 'LOAD_POSTS',
        payload: [mockPost, mockPost2]
      });
    });

    // 投稿を選択
    act(() => {
      result.current.dispatch({
        type: 'SELECT_POST',
        payload: mockPost.id
      });
    });

    // 投稿をハイライト
    act(() => {
      result.current.dispatch({
        type: 'HIGHLIGHT_POST',
        payload: mockPost2.id
      });
    });

    // ローディング状態を設定
    act(() => {
      result.current.dispatch({
        type: 'SET_LOADING',
        payload: { isLoading: true, operation: 'updating' }
      });
    });

    expect(result.current.state.posts).toHaveLength(2);
    expect(result.current.state.selectedPostId).toBe(mockPost.id);
    expect(result.current.state.highlightedPostIds).toContain(mockPost2.id);
    expect(result.current.state.loading.isLoading).toBe(true);
    expect(result.current.state.loading.operation).toBe('updating');
  });
});