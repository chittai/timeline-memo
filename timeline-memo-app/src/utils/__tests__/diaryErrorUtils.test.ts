/**
 * 日記エラーハンドリングユーティリティのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateDateRange,
  handleCalendarGenerationError,
  handleStatsCalculationError,
  handleDiaryEntryError,
  createDiaryError,
  getErrorDisplayMessage,
  logDiaryError
} from '../diaryErrorUtils';
import { ErrorLevel, ERROR_MESSAGES } from '../../types/errors';

// コンソールメソッドをモック
const mockConsole = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

beforeEach(() => {
  vi.clearAllMocks();
  // コンソールメソッドをモック
  vi.spyOn(console, 'info').mockImplementation(mockConsole.info);
  vi.spyOn(console, 'warn').mockImplementation(mockConsole.warn);
  vi.spyOn(console, 'error').mockImplementation(mockConsole.error);
});

describe('diaryErrorUtils', () => {
  describe('validateDateRange', () => {
    it('有効な日付範囲の場合は成功を返す', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      
      const result = validateDateRange(start, end);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ start, end });
      expect(result.fallbackUsed).toBe(false);
    });

    it('開始日が終了日より後の場合はエラーを返し、日付を入れ替える', () => {
      const start = new Date('2024-01-31');
      const end = new Date('2024-01-01');
      
      const result = validateDateRange(start, end);
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('DATE_RANGE_ERROR');
      expect(result.error?.message).toBe(ERROR_MESSAGES.DATE_RANGE.START_AFTER_END);
      expect(result.fallbackUsed).toBe(true);
      expect(result.data).toEqual({ start: end, end: start });
    });

    it('無効な日付の場合はエラーを返す', () => {
      const start = new Date('invalid');
      const end = new Date('2024-01-31');
      
      const result = validateDateRange(start, end);
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('DATE_VALIDATION_ERROR');
      expect(result.fallbackUsed).toBe(true);
    });

    it('未来の日付の場合はエラーを返し、現在日時にフォールバック', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const end = new Date(futureDate);
      end.setDate(end.getDate() + 1);
      
      const result = validateDateRange(futureDate, end);
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('DATE_RANGE_ERROR');
      expect(result.error?.message).toBe(ERROR_MESSAGES.DATE_RANGE.FUTURE_DATE);
      expect(result.fallbackUsed).toBe(true);
    });

    it('範囲が1年を超える場合はエラーを返し、範囲を調整', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2025-12-31');
      
      const result = validateDateRange(start, end);
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('DATE_RANGE_ERROR');
      expect(result.error?.message).toBe(ERROR_MESSAGES.DATE_RANGE.TOO_WIDE_RANGE);
      expect(result.fallbackUsed).toBe(true);
    });
  });

  describe('handleCalendarGenerationError', () => {
    it('カレンダー生成エラーの場合はフォールバックデータを返す', () => {
      const year = 2024;
      const month = 1;
      const error = new Error('テストエラー');
      
      const result = handleCalendarGenerationError(year, month, error);
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('CALENDAR_GENERATION_ERROR');
      expect(result.fallbackUsed).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
    });
  });

  describe('handleStatsCalculationError', () => {
    it('統計計算エラーの場合は部分データまたはデフォルト値を返す', () => {
      const operation = 'テスト操作';
      const error = new Error('テストエラー');
      const partialStats = { totalPosts: 10 };
      
      const result = handleStatsCalculationError(operation, error, partialStats);
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('STATS_CALCULATION_ERROR');
      expect(result.error?.level).toBe(ErrorLevel.WARNING);
      expect(result.fallbackUsed).toBe(true);
      expect(result.data?.totalPosts).toBe(10);
      expect(result.data?.totalDays).toBe(0);
    });
  });

  describe('handleDiaryEntryError', () => {
    it('日記エントリーエラーの場合はフォールバックエントリーを返す', () => {
      const error = new Error('テストエラー');
      const fallbackEntries = [{ date: '2024-01-01', posts: [], postCount: 0 }];
      
      const result = handleDiaryEntryError(error, fallbackEntries);
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('DIARY_ENTRY_ERROR');
      expect(result.fallbackUsed).toBe(true);
      expect(result.data).toEqual(fallbackEntries);
    });
  });

  describe('createDiaryError', () => {
    it('エラー情報を正しく作成する', () => {
      const error = {
        type: 'DATE_RANGE_ERROR' as const,
        message: 'テストメッセージ',
        context: { test: 'data' }
      };
      
      const errorInfo = createDiaryError(error, ErrorLevel.ERROR, true, { fallback: 'data' });
      
      expect(errorInfo.type).toBe('DATE_RANGE_ERROR');
      expect(errorInfo.message).toBe('テストメッセージ');
      expect(errorInfo.level).toBe(ErrorLevel.ERROR);
      expect(errorInfo.recoverable).toBe(true);
      expect(errorInfo.fallbackData).toEqual({ fallback: 'data' });
      expect(errorInfo.context).toEqual({ test: 'data' });
      expect(errorInfo.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('getErrorDisplayMessage', () => {
    it('日付範囲エラーの表示メッセージを生成する', () => {
      const errorInfo = createDiaryError(
        { type: 'DATE_RANGE_ERROR', message: 'テストエラー' },
        ErrorLevel.ERROR,
        true
      );
      
      const message = getErrorDisplayMessage(errorInfo);
      
      expect(message).toBe('テストエラー 自動的に修正されました。');
    });

    it('回復不可能なエラーの表示メッセージを生成する', () => {
      const errorInfo = createDiaryError(
        { type: 'STATS_CALCULATION_ERROR', message: 'テストエラー' },
        ErrorLevel.ERROR,
        false
      );
      
      const message = getErrorDisplayMessage(errorInfo);
      
      expect(message).toBe('統計情報の計算に失敗しました。');
    });

    it('不明なエラータイプの場合はデフォルトメッセージを返す', () => {
      const errorInfo = {
        type: 'UNKNOWN_ERROR',
        message: 'テストエラー',
        timestamp: new Date(),
        level: ErrorLevel.ERROR,
        recoverable: true
      };
      
      const message = getErrorDisplayMessage(errorInfo as any);
      
      expect(message).toBe('問題が発生しましたが、代替データを表示しています。');
    });
  });

  describe('logDiaryError', () => {
    it('エラーレベルに応じて適切なコンソールメソッドを呼び出す', () => {
      const infoError = createDiaryError(
        { type: 'DATE_RANGE_ERROR', message: 'Info' },
        ErrorLevel.INFO
      );
      const warningError = createDiaryError(
        { type: 'DATE_RANGE_ERROR', message: 'Warning' },
        ErrorLevel.WARNING
      );
      const error = createDiaryError(
        { type: 'DATE_RANGE_ERROR', message: 'Error' },
        ErrorLevel.ERROR
      );
      const criticalError = createDiaryError(
        { type: 'DATE_RANGE_ERROR', message: 'Critical' },
        ErrorLevel.CRITICAL
      );

      logDiaryError(infoError);
      logDiaryError(warningError);
      logDiaryError(error);
      logDiaryError(criticalError);

      expect(mockConsole.info).toHaveBeenCalledWith(
        '[INFO] DATE_RANGE_ERROR: Info',
        infoError.context
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        '[WARNING] DATE_RANGE_ERROR: Warning',
        warningError.context
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        '[ERROR] DATE_RANGE_ERROR: Error',
        error.context
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        '🚨 CRITICAL: [CRITICAL] DATE_RANGE_ERROR: Critical',
        criticalError.context
      );
    });
  });
});