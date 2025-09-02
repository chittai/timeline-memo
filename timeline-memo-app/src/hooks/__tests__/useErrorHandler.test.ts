import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../useErrorHandler';
import { useAppContext } from '../../context/AppContext';

// useAppContextをモック
jest.mock('../../context/AppContext');
const mockUseAppContext = useAppContext as jest.MockedFunction<typeof useAppContext>;

const mockDispatch = jest.fn();

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  it('setLoadingが正しくディスパッチされる', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.setLoading({ isLoading: true, operation: 'テスト処理' });
    });
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_LOADING',
      payload: { isLoading: true, operation: 'テスト処理' }
    });
  });

  it('setErrorが正しくディスパッチされる', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.setError('エラーメッセージ');
    });
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_ERROR',
      payload: 'エラーメッセージ'
    });
  });

  it('addToastが正しくディスパッチされる', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    const toast = {
      id: 'test-toast',
      type: 'success' as const,
      title: 'テスト',
      message: 'テストメッセージ'
    };
    
    act(() => {
      result.current.addToast(toast);
    });
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD_TOAST',
      payload: toast
    });
  });

  it('removeToastが正しくディスパッチされる', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.removeToast('test-id');
    });
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'REMOVE_TOAST',
      payload: 'test-id'
    });
  });

  it('clearToastsが正しくディスパッチされる', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.clearToasts();
    });
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'CLEAR_TOASTS'
    });
  });

  it('showErrorがエラートーストを追加する', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.showError(new Error('テストエラー'), 'カスタムタイトル');
    });
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD_TOAST',
      payload: expect.objectContaining({
        type: 'error',
        title: 'カスタムタイトル',
        message: 'テストエラー',
        duration: 8000
      })
    });
  });

  it('showSuccessが成功トーストを追加する', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.showSuccess('成功', 'メッセージ');
    });
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD_TOAST',
      payload: expect.objectContaining({
        type: 'success',
        title: '成功',
        message: 'メッセージ',
        duration: 4000
      })
    });
  });

  it('showWarningが警告トーストを追加する', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.showWarning('警告', 'メッセージ');
    });
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD_TOAST',
      payload: expect.objectContaining({
        type: 'warning',
        title: '警告',
        message: 'メッセージ',
        duration: 6000
      })
    });
  });

  it('showInfoが情報トーストを追加する', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.showInfo('情報', 'メッセージ');
    });
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD_TOAST',
      payload: expect.objectContaining({
        type: 'info',
        title: '情報',
        message: 'メッセージ',
        duration: 5000
      })
    });
  });

  it('showActionToastがアクション付きトーストを追加する', () => {
    const { result } = renderHook(() => useErrorHandler());
    const mockAction = jest.fn();
    
    act(() => {
      result.current.showActionToast('確認', 'メッセージ', 'アクション', mockAction);
    });
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD_TOAST',
      payload: expect.objectContaining({
        type: 'info',
        title: '確認',
        message: 'メッセージ',
        duration: 0,
        action: {
          label: 'アクション',
          onClick: mockAction
        }
      })
    });
  });

  it('executeAsyncが成功時に結果を返す', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const mockOperation = jest.fn().mockResolvedValue('成功結果');
    
    let operationResult: string | null = null;
    
    await act(async () => {
      operationResult = await result.current.executeAsync(mockOperation, {
        loadingMessage: '処理中...',
        successMessage: '成功しました',
        errorTitle: 'エラー',
        context: 'テスト'
      });
    });
    
    expect(operationResult).toBe('成功結果');
    
    // ローディング開始
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_LOADING',
      payload: { isLoading: true, operation: '処理中...' }
    });
    
    // 成功トースト
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD_TOAST',
      payload: expect.objectContaining({
        type: 'success',
        title: '成功しました'
      })
    });
    
    // ローディング終了
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_LOADING',
      payload: { isLoading: false }
    });
  });

  it('executeAsyncがエラー時にnullを返す', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const mockOperation = jest.fn().mockRejectedValue(new Error('テストエラー'));
    
    let operationResult: string | null = 'initial';
    
    await act(async () => {
      operationResult = await result.current.executeAsync(mockOperation, {
        errorTitle: 'カスタムエラー'
      });
    });
    
    expect(operationResult).toBeNull();
    
    // エラートースト
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD_TOAST',
      payload: expect.objectContaining({
        type: 'error',
        title: 'カスタムエラー'
      })
    });
    
    // ローディング終了
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_LOADING',
      payload: { isLoading: false }
    });
  });

  it('executeAsyncWithProgressがプログレス更新を処理する', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const mockOperation = jest.fn().mockImplementation((updateProgress) => {
      updateProgress(50);
      return Promise.resolve('成功');
    });
    
    await act(async () => {
      await result.current.executeAsyncWithProgress(mockOperation, {
        loadingMessage: 'プログレス処理中...'
      });
    });
    
    // プログレス更新
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_LOADING',
      payload: { isLoading: true, operation: 'プログレス処理中...', progress: 50 }
    });
  });
});