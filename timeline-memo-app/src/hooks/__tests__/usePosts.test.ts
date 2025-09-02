import { renderHook, act, waitFor } from '@testing-library/react';
import { usePosts } from '../usePosts';
import { AppProvider } from '../../context/AppContext';
import type { Post, DataService } from '../../types';
import { ReactNode } from 'react';

// DataServiceのモック
const mockDataService: jest.Mocked<DataService> = {
  createPost: jest.fn(),
  updatePost: jest.fn(),
  deletePost: jest.fn(),
  getPost: jest.fn(),
  getAllPosts: jest.fn(),
  getPostsByDateRange: jest.fn(),
  subscribeToUpdates: jest.fn()
};

// IndexedDBServiceをモック
jest.mock('../../services/IndexedDBService', () => ({
  IndexedDBService: jest.fn().mockImplementation(() => mockDataService)
}));

// テスト用のラッパーコンポーネント
const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

// テスト用のモックデータ
const mockPost: Post = {
  id: 'test-id-1',
  content: 'テスト投稿',
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z')
};

const mockPost2: Post = {
  id: 'test-id-2',
  content: 'テスト投稿2',
  createdAt: new Date('2024-01-01T11:00:00Z'),
  updatedAt: new Date('2024-01-01T11:00:00Z')
};

describe('usePosts', () => {
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    
    // コンソールログを抑制
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('初期化時に投稿が読み込まれる', async () => {
    mockDataService.getAllPosts.mockResolvedValue([mockPost, mockPost2]);

    const { result } = renderHook(() => usePosts(), { wrapper });

    await waitFor(() => {
      expect(result.current.posts).toHaveLength(2);
    });

    expect(mockDataService.getAllPosts).toHaveBeenCalledTimes(1);
    expect(result.current.posts).toEqual([mockPost, mockPost2]);
  });

  test('loadPosts が正しく動作する', async () => {
    mockDataService.getAllPosts.mockResolvedValue([mockPost]);

    const { result } = renderHook(() => usePosts(), { wrapper });

    await act(async () => {
      await result.current.loadPosts();
    });

    expect(mockDataService.getAllPosts).toHaveBeenCalled();
    expect(result.current.posts).toEqual([mockPost]);
  });

  test('createPost が正しく動作する', async () => {
    mockDataService.getAllPosts.mockResolvedValue([]);
    mockDataService.createPost.mockResolvedValue(mockPost);

    const { result } = renderHook(() => usePosts(), { wrapper });

    let createdPost: Post | null = null;
    await act(async () => {
      createdPost = await result.current.createPost('テスト投稿');
    });

    expect(mockDataService.createPost).toHaveBeenCalledWith('テスト投稿');
    expect(createdPost).toEqual(mockPost);
    expect(result.current.posts).toContain(mockPost);
  });

  test('updatePost が正しく動作する', async () => {
    const updatedPost = { ...mockPost, content: '更新された投稿' };
    
    mockDataService.getAllPosts.mockResolvedValue([mockPost]);
    mockDataService.updatePost.mockResolvedValue(updatedPost);

    const { result } = renderHook(() => usePosts(), { wrapper });

    // 初期データが読み込まれるまで待機
    await waitFor(() => {
      expect(result.current.posts).toHaveLength(1);
    });

    let updatedResult: Post | null = null;
    await act(async () => {
      updatedResult = await result.current.updatePost(mockPost.id, '更新された投稿');
    });

    expect(mockDataService.updatePost).toHaveBeenCalledWith(mockPost.id, '更新された投稿');
    expect(updatedResult).toEqual(updatedPost);
  });

  test('deletePost が正しく動作する', async () => {
    mockDataService.getAllPosts.mockResolvedValue([mockPost, mockPost2]);
    mockDataService.deletePost.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePosts(), { wrapper });

    // 初期データが読み込まれるまで待機
    await waitFor(() => {
      expect(result.current.posts).toHaveLength(2);
    });

    let deleteResult: boolean = false;
    await act(async () => {
      deleteResult = await result.current.deletePost(mockPost.id);
    });

    expect(mockDataService.deletePost).toHaveBeenCalledWith(mockPost.id);
    expect(deleteResult).toBe(true);
  });

  test('selectPost が正しく動作する', async () => {
    mockDataService.getAllPosts.mockResolvedValue([mockPost]);

    const { result } = renderHook(() => usePosts(), { wrapper });

    act(() => {
      result.current.selectPost(mockPost.id);
    });

    expect(result.current.selectedPostId).toBe(mockPost.id);
  });

  test('getPost が正しく動作する', async () => {
    mockDataService.getAllPosts.mockResolvedValue([]);
    mockDataService.getPost.mockResolvedValue(mockPost);

    const { result } = renderHook(() => usePosts(), { wrapper });

    let retrievedPost: Post | null = null;
    await act(async () => {
      retrievedPost = await result.current.getPost(mockPost.id);
    });

    expect(mockDataService.getPost).toHaveBeenCalledWith(mockPost.id);
    expect(retrievedPost).toEqual(mockPost);
  });

  test('getPostsByDateRange が正しく動作する', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-02');
    
    mockDataService.getAllPosts.mockResolvedValue([]);
    mockDataService.getPostsByDateRange.mockResolvedValue([mockPost]);

    const { result } = renderHook(() => usePosts(), { wrapper });

    let posts: Post[] = [];
    await act(async () => {
      posts = await result.current.getPostsByDateRange(startDate, endDate);
    });

    expect(mockDataService.getPostsByDateRange).toHaveBeenCalledWith(startDate, endDate);
    expect(posts).toEqual([mockPost]);
  });

  test('clearError が正しく動作する', async () => {
    mockDataService.getAllPosts.mockRejectedValue(new Error('テストエラー'));

    const { result } = renderHook(() => usePosts(), { wrapper });

    // エラーが発生するまで待機
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  test('createPost でエラーが発生した場合、適切に処理される', async () => {
    mockDataService.getAllPosts.mockResolvedValue([]);
    mockDataService.createPost.mockRejectedValue(new Error('作成エラー'));

    const { result } = renderHook(() => usePosts(), { wrapper });

    let createdPost: Post | null = null;
    await act(async () => {
      createdPost = await result.current.createPost('テスト投稿');
    });

    expect(createdPost).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  test('updatePost でエラーが発生した場合、適切に処理される', async () => {
    mockDataService.getAllPosts.mockResolvedValue([mockPost]);
    mockDataService.updatePost.mockRejectedValue(new Error('更新エラー'));

    const { result } = renderHook(() => usePosts(), { wrapper });

    // 初期データが読み込まれるまで待機
    await waitFor(() => {
      expect(result.current.posts).toHaveLength(1);
    });

    let updatedPost: Post | null = null;
    await act(async () => {
      updatedPost = await result.current.updatePost(mockPost.id, '更新された投稿');
    });

    expect(updatedPost).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  test('deletePost でエラーが発生した場合、適切に処理される', async () => {
    mockDataService.getAllPosts.mockResolvedValue([mockPost]);
    mockDataService.deletePost.mockRejectedValue(new Error('削除エラー'));

    const { result } = renderHook(() => usePosts(), { wrapper });

    // 初期データが読み込まれるまで待機
    await waitFor(() => {
      expect(result.current.posts).toHaveLength(1);
    });

    let deleteResult: boolean = true;
    await act(async () => {
      deleteResult = await result.current.deletePost(mockPost.id);
    });

    expect(deleteResult).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  test('getPost でエラーが発生した場合、適切に処理される', async () => {
    mockDataService.getAllPosts.mockResolvedValue([]);
    mockDataService.getPost.mockRejectedValue(new Error('取得エラー'));

    const { result } = renderHook(() => usePosts(), { wrapper });

    let retrievedPost: Post | null = undefined;
    await act(async () => {
      retrievedPost = await result.current.getPost(mockPost.id);
    });

    expect(retrievedPost).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  test('getPostsByDateRange でエラーが発生した場合、適切に処理される', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-02');
    
    mockDataService.getAllPosts.mockResolvedValue([]);
    mockDataService.getPostsByDateRange.mockRejectedValue(new Error('範囲取得エラー'));

    const { result } = renderHook(() => usePosts(), { wrapper });

    let posts: Post[] = [];
    await act(async () => {
      posts = await result.current.getPostsByDateRange(startDate, endDate);
    });

    expect(posts).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });
});