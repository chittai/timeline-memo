import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  createErrorToast,
  createSuccessToast,
  createWarningToast,
  createInfoToast,
  createActionToast,
  handleAsyncOperation,
  logError
} from '../utils/errorUtils';
import type { Toast, LoadingState, AppError } from '../types';

/**
 * エラーハンドリングとユーザーフィードバックを管理するカスタムフック
 */
export function useErrorHandler() {
  const { dispatch } = useAppContext();

  // ローディング状態の設定
  const setLoading = useCallback((loading: LoadingState) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, [dispatch]);

  // エラーの設定
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, [dispatch]);

  // トースト通知の追加
  const addToast = useCallback((toast: Toast) => {
    dispatch({ type: 'ADD_TOAST', payload: toast });
  }, [dispatch]);

  // トースト通知の削除
  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, [dispatch]);

  // 全てのトースト通知をクリア
  const clearToasts = useCallback(() => {
    dispatch({ type: 'CLEAR_TOASTS' });
  }, [dispatch]);

  // エラートースト表示
  const showError = useCallback((error: unknown, title?: string) => {
    const toast = createErrorToast(error, title);
    addToast(toast);
    logError(error);
  }, [addToast]);

  // 成功トースト表示
  const showSuccess = useCallback((title: string, message?: string) => {
    const toast = createSuccessToast(title, message);
    addToast(toast);
  }, [addToast]);

  // 警告トースト表示
  const showWarning = useCallback((title: string, message?: string) => {
    const toast = createWarningToast(title, message);
    addToast(toast);
  }, [addToast]);

  // 情報トースト表示
  const showInfo = useCallback((title: string, message?: string) => {
    const toast = createInfoToast(title, message);
    addToast(toast);
  }, [addToast]);

  // アクション付きトースト表示
  const showActionToast = useCallback((
    title: string,
    message: string,
    actionLabel: string,
    onAction: () => void
  ) => {
    const toast = createActionToast(title, message, actionLabel, onAction);
    addToast(toast);
  }, [addToast]);

  // 非同期操作のラッパー（ローディング状態とエラーハンドリング付き）
  const executeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorTitle?: string;
      context?: string;
    }
  ): Promise<T | null> => {
    const {
      loadingMessage = '処理中...',
      successMessage,
      errorTitle = '操作に失敗しました',
      context
    } = options || {};

    // ローディング開始
    setLoading({
      isLoading: true,
      operation: loadingMessage
    });

    try {
      const result = await handleAsyncOperation(operation, context);
      
      if (result.success) {
        // 成功時の処理
        if (successMessage) {
          showSuccess(successMessage);
        }
        return result.data;
      }
      
      // エラー時の処理（型安全な方法）
      const errorResult = result as { success: false; error: AppError };
      showError(errorResult.error, errorTitle);
      return null;
    } finally {
      // ローディング終了
      setLoading({ isLoading: false });
    }
  }, [setLoading, showError, showSuccess]);

  // プログレス付き非同期操作のラッパー
  const executeAsyncWithProgress = useCallback(async <T>(
    operation: (updateProgress: (progress: number) => void) => Promise<T>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorTitle?: string;
      context?: string;
    }
  ): Promise<T | null> => {
    const {
      loadingMessage = '処理中...',
      successMessage,
      errorTitle = '操作に失敗しました',
      context
    } = options || {};

    // プログレス更新関数
    const updateProgress = (progress: number) => {
      setLoading({
        isLoading: true,
        operation: loadingMessage,
        progress
      });
    };

    // ローディング開始
    setLoading({
      isLoading: true,
      operation: loadingMessage,
      progress: 0
    });

    try {
      const wrappedOperation = () => operation(updateProgress);
      const result = await handleAsyncOperation(wrappedOperation, context);
      
      if (result.success) {
        // 成功時の処理
        if (successMessage) {
          showSuccess(successMessage);
        }
        return result.data;
      }
      
      // エラー時の処理（型安全な方法）
      const errorResult = result as { success: false; error: AppError };
      showError(errorResult.error, errorTitle);
      return null;
    } finally {
      // ローディング終了
      setLoading({ isLoading: false });
    }
  }, [setLoading, showError, showSuccess]);

  return {
    // 状態管理
    setLoading,
    setError,
    
    // トースト通知
    addToast,
    removeToast,
    clearToasts,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    showActionToast,
    
    // 非同期操作ヘルパー
    executeAsync,
    executeAsyncWithProgress,
  };
}