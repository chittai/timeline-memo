import { renderHook, act } from '@testing-library/react';
import { useDataPersistence } from '../useDataPersistence';
import { useAppContext } from '../../context/AppContext';
import { IndexedDBService } from '../../services/IndexedDBService';
import * as dataIntegrityUtils from '../../utils/dataIntegrityUtils';

// モックの設定
jest.mock('../../context/AppContext');
jest.mock('../../services/IndexedDBService');
jest.mock('../../utils/dataIntegrityUtils');

const mockUseAppContext = useAppContext as jest.MockedFunction<typeof useAppContext>;
const MockedIndexedDBService = IndexedDBService as jest.MockedClass<typeof IndexedDBService>;

describe('useDataPersistence', () => {
  let mockDispatch: jest.Mock;
  let mockDataService: jest.Mocked<IndexedDBService>;
  let mockPerformDataIntegrityCheck: jest.SpyInstance;
  let mockCheckDatabaseHealth: jest.SpyInstance;
  let mockCheckStorageQuota: jest.SpyInstance;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockDataService = {
      init: jest.fn(),
      getAllPosts: jest.fn(),
      getStats: jest.fn(),
      getStatus: jest.fn(),
      close: jest.fn(),
    } as any;

    mockUseAppContext.mockReturnValue({
      state: {
        posts: [],
        selectedPostId: null,
        highlightedPostIds: [],
        loading: { isLoading: false },
        error: null,
        toasts: [],
        viewMode: 'timeline'
      },
      dispatch: mockDispatch
    });

    MockedIndexedDBService.mockImplementation(() => mockDataService);

    // データ整合性ユーティリティのモック設定
    mockPerformDataIntegrityCheck = jest.spyOn(dataIntegrityUtils, 'performDataIntegrityCheck');
    mockCheckDatabaseHealth = jest.spyOn(dataIntegrityUtils, 'checkDatabaseHealth');
    mockCheckStorageQuota = jest.spyOn(dataIntegrityUtils, 'checkStorageQuota');

    mockPerformDataIntegrityCheck.mockReturnValue({
      isValid: true,
      validPosts: [],
      issues: []
    });
    mockCheckDatabaseHealth.mockReturnValue({ isHealthy: true, warnings: [] });
    mockCheckStorageQuota.mockResolvedValue({
      used: 1000000,
      available: 10000000,
      percentage: 10,
      isNearLimit: false
    });

    // コンソールログをモック
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('loadInitialData', () => {
    it('正常にデータを復元できること', async () => {
      const mockPosts = [
        {
          id: '1',
          content: 'テスト投稿1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: '2',
          content: 'テスト投稿2',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02')
        }
      ];

      mockDataService.init.mockResolvedValue();
      mockDataService.getAllPosts.mockResolvedValue(mockPosts);
      mockPerformDataIntegrityCheck.mockReturnValue({
        isValid: true,
        validPosts: mockPosts,
        issues: []
      });

      const { result } = renderHook(() => useDataPersistence());

      await act(async () => {
        await result.current.loadInitialData();
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_LOADING', payload: true });
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_ERROR', payload: null });
      expect(mockDataService.init).toHaveBeenCalled();
      expect(mockDataService.getAllPosts).toHaveBeenCalled();
      expect(mockPerformDataIntegrityCheck).toHaveBeenCalledWith(mockPosts);
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOAD_POSTS', payload: mockPosts });
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_LOADING', payload: false });
    });

    it('データ復元エラー時に適切にエラーハンドリングされること', async () => {
      const error = new Error('データベース接続エラー');
      mockDataService.init.mockRejectedValue(error);

      const { result } = renderHook(() => useDataPersistence());

      await act(async () => {
        await result.current.loadInitialData();
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_LOADING', payload: true });
      expect(mockDispatch).toHaveBeenCalledWith({ 
        type: 'SET_ERROR', 
        payload: 'データの復元中にエラーが発生しました。ページを再読み込みしてください。' 
      });
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_LOADING', payload: false });
    });
  });

  describe('verifyDataIntegrity', () => {
    it('データ整合性が正常な場合にtrueを返すこと', async () => {
      mockUseAppContext.mockReturnValue({
        state: {
          posts: [{ id: '1' }, { id: '2' }] as any,
          selectedPostId: null,
          highlightedPostIds: [],
          loading: { isLoading: false },
          error: null,
          toasts: [],
          viewMode: 'timeline'
        },
        dispatch: mockDispatch
      });

      mockDataService.getStats.mockResolvedValue({
        totalPosts: 2,
        oldestPost: new Date('2024-01-01'),
        newestPost: new Date('2024-01-02')
      });

      const { result } = renderHook(() => useDataPersistence());

      let verifyResult: boolean;
      await act(async () => {
        verifyResult = await result.current.verifyDataIntegrity();
      });

      expect(verifyResult!).toBe(true);
      expect(mockDataService.getStats).toHaveBeenCalled();
    });

    it('データ整合性に問題がある場合にデータを再読み込みすること', async () => {
      mockUseAppContext.mockReturnValue({
        state: {
          posts: [{ id: '1' }] as any, // 1件のみ
          selectedPostId: null,
          highlightedPostIds: [],
          loading: { isLoading: false },
          error: null,
          toasts: [],
          viewMode: 'timeline'
        },
        dispatch: mockDispatch
      });

      mockDataService.getStats.mockResolvedValue({
        totalPosts: 2, // DBには2件
        oldestPost: new Date('2024-01-01'),
        newestPost: new Date('2024-01-02')
      });

      mockDataService.init.mockResolvedValue();
      mockDataService.getAllPosts.mockResolvedValue([
        { id: '1', content: 'テスト1', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', content: 'テスト2', createdAt: new Date(), updatedAt: new Date() }
      ]);

      const { result } = renderHook(() => useDataPersistence());

      await act(async () => {
        await result.current.verifyDataIntegrity();
      });

      expect(console.warn).toHaveBeenCalledWith(
        '[データ整合性警告] state内の投稿数とDB内の投稿数が一致しません',
        { stateCount: 1, dbCount: 2 }
      );
      expect(mockDataService.getAllPosts).toHaveBeenCalled();
    });

    it('エラー時にfalseを返すこと', async () => {
      const error = new Error('統計情報取得エラー');
      mockDataService.getStats.mockRejectedValue(error);

      const { result } = renderHook(() => useDataPersistence());

      let verifyResult: boolean;
      await act(async () => {
        verifyResult = await result.current.verifyDataIntegrity();
      });

      expect(verifyResult!).toBe(false);
      expect(console.error).toHaveBeenCalledWith('[データ整合性確認エラー]', error);
    });
  });

  describe('recoverFromError', () => {
    it('正常にエラーから復旧できること', async () => {
      mockDataService.getStatus.mockReturnValue({
        isInitialized: true,
        isConnected: true
      });
      mockDataService.init.mockResolvedValue();
      mockDataService.getAllPosts.mockResolvedValue([]);

      const { result } = renderHook(() => useDataPersistence());

      let recoverResult: boolean;
      await act(async () => {
        recoverResult = await result.current.recoverFromError();
      });

      expect(recoverResult!).toBe(true);
      expect(mockDataService.getStatus).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('[データ復旧] エラーからの復旧を開始します');
      expect(console.log).toHaveBeenCalledWith('[データ復旧] 復旧が完了しました');
    });

    it('データベースが未初期化の場合に再初期化すること', async () => {
      mockDataService.getStatus.mockReturnValue({
        isInitialized: false,
        isConnected: false
      });
      mockDataService.init.mockResolvedValue();
      mockDataService.getAllPosts.mockResolvedValue([]);

      const { result } = renderHook(() => useDataPersistence());

      await act(async () => {
        await result.current.recoverFromError();
      });

      expect(mockDataService.init).toHaveBeenCalled();
    });

    it('復旧エラー時に適切にエラーハンドリングされること', async () => {
      const error = new Error('復旧エラー');
      mockDataService.getStatus.mockImplementation(() => {
        throw error;
      });

      const { result } = renderHook(() => useDataPersistence());

      let recoverResult: boolean;
      await act(async () => {
        recoverResult = await result.current.recoverFromError();
      });

      expect(recoverResult!).toBe(false);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_ERROR',
        payload: 'データの復旧に失敗しました。ブラウザのキャッシュをクリアして再度お試しください。'
      });
    });
  });

  describe('handleOfflineStatus', () => {
    let mockAddEventListener: jest.SpyInstance;
    let mockRemoveEventListener: jest.SpyInstance;

    beforeEach(() => {
      mockAddEventListener = jest.spyOn(window, 'addEventListener');
      mockRemoveEventListener = jest.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
      mockAddEventListener.mockRestore();
      mockRemoveEventListener.mockRestore();
    });

    it('オンライン/オフラインイベントリスナーを設定すること', () => {
      const { result } = renderHook(() => useDataPersistence());

      const cleanup = result.current.handleOfflineStatus();

      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

      // クリーンアップ関数の実行
      cleanup();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('handleVisibilityChange', () => {
    let mockAddEventListener: jest.SpyInstance;
    let mockRemoveEventListener: jest.SpyInstance;

    beforeEach(() => {
      mockAddEventListener = jest.spyOn(document, 'addEventListener');
      mockRemoveEventListener = jest.spyOn(document, 'removeEventListener');
    });

    afterEach(() => {
      mockAddEventListener.mockRestore();
      mockRemoveEventListener.mockRestore();
    });

    it('visibilitychangeイベントリスナーを設定すること', () => {
      const { result } = renderHook(() => useDataPersistence());

      const cleanup = result.current.handleVisibilityChange();

      expect(mockAddEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

      // クリーンアップ関数の実行
      cleanup();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });
  });

  describe('handleBeforeUnload', () => {
    let mockAddEventListener: jest.SpyInstance;
    let mockRemoveEventListener: jest.SpyInstance;

    beforeEach(() => {
      mockAddEventListener = jest.spyOn(window, 'addEventListener');
      mockRemoveEventListener = jest.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
      mockAddEventListener.mockRestore();
      mockRemoveEventListener.mockRestore();
    });

    it('beforeunloadイベントリスナーを設定すること', () => {
      const { result } = renderHook(() => useDataPersistence());

      const cleanup = result.current.handleBeforeUnload();

      expect(mockAddEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));

      // クリーンアップ関数の実行
      cleanup();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });
  });
});