import {
  getErrorMessage,
  getAppErrorMessage,
  createErrorToast,
  createSuccessToast,
  createWarningToast,
  createInfoToast,
  createActionToast,
  logError,
  handleAsyncOperation
} from '../errorUtils';
import type { AppError } from '../../types';

// console.errorをモック
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('errorUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('getErrorMessage', () => {
    it('Errorオブジェクトからメッセージを取得する', () => {
      const error = new Error('テストエラー');
      expect(getErrorMessage(error)).toBe('テストエラー');
    });

    it('文字列エラーをそのまま返す', () => {
      expect(getErrorMessage('文字列エラー')).toBe('文字列エラー');
    });

    it('不明なエラーの場合はデフォルトメッセージを返す', () => {
      expect(getErrorMessage(null)).toBe('予期しないエラーが発生しました');
      expect(getErrorMessage(undefined)).toBe('予期しないエラーが発生しました');
      expect(getErrorMessage(123)).toBe('予期しないエラーが発生しました');
    });
  });

  describe('getAppErrorMessage', () => {
    it('バリデーションエラーのメッセージを生成する', () => {
      const error: AppError = {
        type: 'VALIDATION_ERROR',
        message: '必須項目です',
        field: 'コンテンツ'
      };
      expect(getAppErrorMessage(error)).toBe('コンテンツ: 必須項目です');
    });

    it('フィールドなしのバリデーションエラーのメッセージを生成する', () => {
      const error: AppError = {
        type: 'VALIDATION_ERROR',
        message: '入力値が不正です'
      };
      expect(getAppErrorMessage(error)).toBe('入力エラー: 入力値が不正です');
    });

    it('ストレージエラーのメッセージを生成する', () => {
      const error: AppError = {
        type: 'STORAGE_ERROR',
        message: '保存に失敗しました',
        operation: '作成'
      };
      expect(getAppErrorMessage(error)).toBe('データ作成エラー: 保存に失敗しました');
    });

    it('ネットワークエラーのメッセージを生成する', () => {
      const error: AppError = {
        type: 'NETWORK_ERROR',
        message: '接続できません'
      };
      expect(getAppErrorMessage(error)).toBe('ネットワークエラー: 接続できません');
    });

    it('不明なエラーのメッセージを生成する', () => {
      const error: AppError = {
        type: 'UNKNOWN_ERROR',
        message: '予期しないエラー'
      };
      expect(getAppErrorMessage(error)).toBe('エラー: 予期しないエラー');
    });
  });

  describe('createErrorToast', () => {
    it('エラートーストを作成する', () => {
      const error = new Error('テストエラー');
      const toast = createErrorToast(error, 'カスタムタイトル');
      
      expect(toast.type).toBe('error');
      expect(toast.title).toBe('カスタムタイトル');
      expect(toast.message).toBe('テストエラー');
      expect(toast.duration).toBe(8000);
      expect(toast.id).toMatch(/^error-/);
    });

    it('デフォルトタイトルでエラートーストを作成する', () => {
      const error = new Error('テストエラー');
      const toast = createErrorToast(error);
      
      expect(toast.title).toBe('エラーが発生しました');
    });
  });

  describe('createSuccessToast', () => {
    it('成功トーストを作成する', () => {
      const toast = createSuccessToast('成功しました', '操作が完了しました');
      
      expect(toast.type).toBe('success');
      expect(toast.title).toBe('成功しました');
      expect(toast.message).toBe('操作が完了しました');
      expect(toast.duration).toBe(4000);
      expect(toast.id).toMatch(/^success-/);
    });
  });

  describe('createWarningToast', () => {
    it('警告トーストを作成する', () => {
      const toast = createWarningToast('警告', '注意が必要です');
      
      expect(toast.type).toBe('warning');
      expect(toast.title).toBe('警告');
      expect(toast.message).toBe('注意が必要です');
      expect(toast.duration).toBe(6000);
      expect(toast.id).toMatch(/^warning-/);
    });
  });

  describe('createInfoToast', () => {
    it('情報トーストを作成する', () => {
      const toast = createInfoToast('情報', 'お知らせです');
      
      expect(toast.type).toBe('info');
      expect(toast.title).toBe('情報');
      expect(toast.message).toBe('お知らせです');
      expect(toast.duration).toBe(5000);
      expect(toast.id).toMatch(/^info-/);
    });
  });

  describe('createActionToast', () => {
    it('アクション付きトーストを作成する', () => {
      const mockAction = jest.fn();
      const toast = createActionToast('確認', 'アクションを実行しますか？', '実行', mockAction);
      
      expect(toast.type).toBe('info');
      expect(toast.title).toBe('確認');
      expect(toast.message).toBe('アクションを実行しますか？');
      expect(toast.duration).toBe(0);
      expect(toast.action?.label).toBe('実行');
      expect(toast.action?.onClick).toBe(mockAction);
      expect(toast.id).toMatch(/^action-/);
    });
  });

  describe('logError', () => {
    beforeEach(() => {
      // NODE_ENVを開発環境に設定
      process.env.NODE_ENV = 'development';
    });

    it('開発環境でエラーログを出力する', () => {
      const error = new Error('テストエラー');
      logError(error, 'テストコンテキスト');
      
      expect(mockConsoleError).toHaveBeenCalledWith('[Error - テストコンテキスト]:', error);
    });

    it('コンテキストなしでエラーログを出力する', () => {
      const error = new Error('テストエラー');
      logError(error);
      
      expect(mockConsoleError).toHaveBeenCalledWith('[Error]:', error);
    });

    it('スタックトレースがある場合は追加で出力する', () => {
      const error = new Error('テストエラー');
      error.stack = 'スタックトレース情報';
      logError(error);
      
      expect(mockConsoleError).toHaveBeenCalledWith('[Error]:', error);
      expect(mockConsoleError).toHaveBeenCalledWith('Stack trace:', 'スタックトレース情報');
    });

    it('本番環境ではログを出力しない', () => {
      process.env.NODE_ENV = 'production';
      
      const error = new Error('テストエラー');
      logError(error);
      
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });

  describe('handleAsyncOperation', () => {
    it('成功時は結果を返す', async () => {
      const mockOperation = jest.fn().mockResolvedValue('成功結果');
      
      const result = await handleAsyncOperation(mockOperation, 'テスト操作');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('成功結果');
      }
    });

    it('エラー時はAppErrorを返す', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('テストエラー'));
      
      const result = await handleAsyncOperation(mockOperation, 'テスト操作');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toBe('テストエラー');
      }
    });

    it('ValidationErrorを適切に変換する', async () => {
      const validationError = new Error('バリデーションエラー');
      validationError.name = 'ValidationError';
      const mockOperation = jest.fn().mockRejectedValue(validationError);
      
      const result = await handleAsyncOperation(mockOperation);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('バリデーションエラー');
      }
    });

    it('QuotaExceededErrorを適切に変換する', async () => {
      const quotaError = new Error('quota exceeded');
      quotaError.name = 'QuotaExceededError';
      const mockOperation = jest.fn().mockRejectedValue(quotaError);
      
      const result = await handleAsyncOperation(mockOperation, 'ストレージ操作');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('STORAGE_ERROR');
        expect(result.error.message).toBe('ストレージの容量が不足しています');
        expect((result.error as any).operation).toBe('ストレージ操作');
      }
    });

    it('ネットワークエラーを適切に変換する', async () => {
      const networkError = new Error('network error occurred');
      const mockOperation = jest.fn().mockRejectedValue(networkError);
      
      const result = await handleAsyncOperation(mockOperation);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NETWORK_ERROR');
        expect(result.error.message).toBe('ネットワーク接続に問題があります');
      }
    });

    it('非Errorオブジェクトを適切に処理する', async () => {
      const mockOperation = jest.fn().mockRejectedValue('文字列エラー');
      
      const result = await handleAsyncOperation(mockOperation);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toBe('予期しないエラーが発生しました');
      }
    });
  });
});