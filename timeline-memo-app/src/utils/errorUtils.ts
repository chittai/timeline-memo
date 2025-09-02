import type { AppError, Toast } from '../types';

/**
 * エラーハンドリング関連のユーティリティ関数
 */

/**
 * エラーオブジェクトからユーザーフレンドリーなメッセージを生成
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return '予期しないエラーが発生しました';
}

/**
 * AppErrorからユーザーフレンドリーなメッセージを生成
 */
export function getAppErrorMessage(error: AppError): string {
  switch (error.type) {
    case 'VALIDATION_ERROR':
      return error.field 
        ? `${error.field}: ${error.message}`
        : `入力エラー: ${error.message}`;
    
    case 'STORAGE_ERROR':
      return error.operation
        ? `データ${error.operation}エラー: ${error.message}`
        : `データ保存エラー: ${error.message}`;
    
    case 'NETWORK_ERROR':
      return `ネットワークエラー: ${error.message}`;
    
    case 'UNKNOWN_ERROR':
    default:
      return `エラー: ${error.message}`;
  }
}

/**
 * エラーからトースト通知を生成
 */
export function createErrorToast(error: unknown, title: string = 'エラーが発生しました'): Toast {
  const message = error instanceof Error && 'type' in error
    ? getAppErrorMessage(error as AppError)
    : getErrorMessage(error);

  return {
    id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type: 'error',
    title,
    message,
    duration: 8000, // エラーは少し長めに表示
  };
}

/**
 * 成功メッセージのトースト通知を生成
 */
export function createSuccessToast(title: string, message?: string): Toast {
  return {
    id: `success-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type: 'success',
    title,
    message,
    duration: 4000,
  };
}

/**
 * 警告メッセージのトースト通知を生成
 */
export function createWarningToast(title: string, message?: string): Toast {
  return {
    id: `warning-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type: 'warning',
    title,
    message,
    duration: 6000,
  };
}

/**
 * 情報メッセージのトースト通知を生成
 */
export function createInfoToast(title: string, message?: string): Toast {
  return {
    id: `info-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type: 'info',
    title,
    message,
    duration: 5000,
  };
}

/**
 * 操作確認用のトースト通知を生成（アクション付き）
 */
export function createActionToast(
  title: string,
  message: string,
  actionLabel: string,
  onAction: () => void
): Toast {
  return {
    id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type: 'info',
    title,
    message,
    duration: 0, // 手動で閉じるまで表示
    action: {
      label: actionLabel,
      onClick: onAction,
    },
  };
}

/**
 * エラーログを出力（開発環境のみ）
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
    
    // スタックトレースがある場合は出力
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

/**
 * 非同期操作のエラーハンドリングラッパー
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<{ success: true; data: T } | { success: false; error: AppError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    logError(error, context);
    
    // エラーの種類を判定してAppErrorに変換
    let appError: AppError;
    
    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        appError = {
          type: 'VALIDATION_ERROR',
          message: error.message,
        };
      } else if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        appError = {
          type: 'STORAGE_ERROR',
          message: 'ストレージの容量が不足しています',
          operation: context,
        };
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        appError = {
          type: 'NETWORK_ERROR',
          message: 'ネットワーク接続に問題があります',
        };
      } else {
        appError = {
          type: 'UNKNOWN_ERROR',
          message: error.message,
        };
      }
    } else {
      appError = {
        type: 'UNKNOWN_ERROR',
        message: '予期しないエラーが発生しました',
      };
    }
    
    return { success: false, error: appError };
  }
}