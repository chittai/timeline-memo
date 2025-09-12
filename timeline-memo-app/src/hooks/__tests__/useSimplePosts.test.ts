import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useSimplePosts } from '../useSimplePosts';

// LocalStorageのモック
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('useSimplePosts', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('初期状態では空の投稿配列を返す', () => {
    const { result } = renderHook(() => useSimplePosts());
    
    expect(result.current.posts).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('新しい投稿を作成できる', async () => {
    const { result } = renderHook(() => useSimplePosts());
    
    await act(async () => {
      await result.current.createPost('テスト投稿');
    });
    
    expect(result.current.posts).toHaveLength(1);
    expect(result.current.posts[0].content).toBe('テスト投稿');
    expect(result.current.posts[0].id).toBeDefined();
    expect(result.current.posts[0].createdAt).toBeInstanceOf(Date);
  });

  it('投稿を更新できる', async () => {
    const { result } = renderHook(() => useSimplePosts());
    
    // 投稿を作成
    await act(async () => {
      await result.current.createPost('元の投稿');
    });
    
    const postId = result.current.posts[0].id;
    
    // 投稿を更新
    await act(async () => {
      await result.current.updatePost(postId, '更新された投稿');
    });
    
    expect(result.current.posts[0].content).toBe('更新された投稿');
    expect(result.current.posts[0].updatedAt).toBeInstanceOf(Date);
  });

  it('投稿を削除できる', async () => {
    const { result } = renderHook(() => useSimplePosts());
    
    // 投稿を作成
    await act(async () => {
      await result.current.createPost('削除予定の投稿');
    });
    
    const postId = result.current.posts[0].id;
    
    // 投稿を削除
    await act(async () => {
      await result.current.deletePost(postId);
    });
    
    expect(result.current.posts).toHaveLength(0);
  });

  it('統計情報を正しく計算する', async () => {
    const { result } = renderHook(() => useSimplePosts());
    
    // 複数の投稿を作成
    await act(async () => {
      await result.current.createPost('投稿1');
    });
    
    await act(async () => {
      await result.current.createPost('投稿2');
    });
    
    await act(async () => {
      await result.current.createPost('投稿3');
    });
    
    const stats = result.current.getStats();
    
    expect(stats.totalPosts).toBe(3);
    expect(stats.continuousDays).toBeGreaterThanOrEqual(1);
    expect(stats.thisMonth).toBeGreaterThanOrEqual(1);
  });

  it('LocalStorageに投稿が保存される', async () => {
    const { result } = renderHook(() => useSimplePosts());
    
    await act(async () => {
      await result.current.createPost('保存テスト');
    });
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'timeline-memo-posts',
      expect.any(String)
    );
  });

  it('LocalStorageから投稿を読み込む', () => {
    // 事前にLocalStorageにデータを設定
    const mockPosts = [
      {
        id: '1',
        content: '既存の投稿',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: []
      }
    ];
    
    mockLocalStorage.setItem('timeline-memo-posts', JSON.stringify(mockPosts));
    
    const { result } = renderHook(() => useSimplePosts());
    
    expect(result.current.posts).toHaveLength(1);
    expect(result.current.posts[0].content).toBe('既存の投稿');
  });

  it('無効なLocalStorageデータを処理する', () => {
    // 無効なJSONデータを設定
    mockLocalStorage.setItem('timeline-memo-posts', 'invalid json');
    
    const { result } = renderHook(() => useSimplePosts());
    
    // エラーが発生せず、空の配列が返される
    expect(result.current.posts).toEqual([]);
  });

  it('存在しない投稿の更新でエラーが発生する', async () => {
    const { result } = renderHook(() => useSimplePosts());
    
    await expect(
      act(async () => {
        await result.current.updatePost('non-existent-id', '更新内容');
      })
    ).rejects.toThrow('投稿の更新に失敗しました');
  });

  it('存在しない投稿の削除は正常に処理される', async () => {
    const { result } = renderHook(() => useSimplePosts());
    
    // 存在しない投稿の削除は例外を投げずに正常に処理される
    await act(async () => {
      await result.current.deletePost('non-existent-id');
    });
    
    // 投稿数は変わらない
    expect(result.current.posts).toHaveLength(0);
  });
});