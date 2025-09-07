/**
 * 日記機能のエラーハンドリングユーティリティ
 */

import type { DiaryError, DiaryErrorInfo, ErrorHandlerResult } from '../types/errors';
import { ErrorLevel, ERROR_MESSAGES } from '../types/errors';
import type { DiaryEntry, CalendarDay, DiaryStats } from '../types';

// ErrorLevelとERROR_MESSAGESを再エクスポート
export { ErrorLevel, ERROR_MESSAGES };

/**
 * エラー情報を作成する
 */
export function createDiaryError(
  error: DiaryError,
  level: ErrorLevel = ErrorLevel.ERROR,
  recoverable: boolean = true,
  fallbackData?: any
): DiaryErrorInfo {
  return {
    type: error.type,
    message: error.message,
    timestamp: new Date(),
    context: error.context,
    level,
    recoverable,
    fallbackData
  };
}

/**
 * 日付範囲の検証とエラーハンドリング
 */
export function validateDateRange(start: Date, end: Date): ErrorHandlerResult<{ start: Date; end: Date }> {
  try {
    // 日付の有効性チェック
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const error = createDiaryError(
        {
          type: 'DATE_VALIDATION_ERROR',
          message: ERROR_MESSAGES.VALIDATION.INVALID_DATE_FORMAT,
          context: { invalidDate: { start, end } }
        },
        ErrorLevel.ERROR,
        true,
        { start: new Date(), end: new Date() }
      );
      return { success: false, error, fallbackUsed: true, data: error.fallbackData };
    }

    // 開始日が終了日より後でないかチェック
    if (start > end) {
      const error = createDiaryError(
        {
          type: 'DATE_RANGE_ERROR',
          message: ERROR_MESSAGES.DATE_RANGE.START_AFTER_END,
          context: { start, end }
        },
        ErrorLevel.WARNING,
        true,
        { start: end, end: start } // 日付を入れ替える
      );
      return { success: false, error, fallbackUsed: true, data: error.fallbackData };
    }

    // 未来の日付チェック
    const now = new Date();
    if (start > now) {
      const error = createDiaryError(
        {
          type: 'DATE_RANGE_ERROR',
          message: ERROR_MESSAGES.DATE_RANGE.FUTURE_DATE,
          context: { start, end }
        },
        ErrorLevel.WARNING,
        true,
        { start: now, end: now }
      );
      return { success: false, error, fallbackUsed: true, data: error.fallbackData };
    }

    // 範囲が広すぎないかチェック（1年以内）
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > oneYearMs) {
      const fallbackEnd = new Date(start.getTime() + oneYearMs);
      const error = createDiaryError(
        {
          type: 'DATE_RANGE_ERROR',
          message: ERROR_MESSAGES.DATE_RANGE.TOO_WIDE_RANGE,
          context: { start, end }
        },
        ErrorLevel.WARNING,
        true,
        { start, end: fallbackEnd }
      );
      return { success: false, error, fallbackUsed: true, data: error.fallbackData };
    }

    return { success: true, data: { start, end }, fallbackUsed: false };
  } catch (err) {
    const error = createDiaryError(
      {
        type: 'DATE_VALIDATION_ERROR',
        message: `日付検証中にエラーが発生しました: ${err instanceof Error ? err.message : '不明なエラー'}`,
        context: { start, end, originalError: err }
      },
      ErrorLevel.ERROR,
      true,
      { start: new Date(), end: new Date() }
    );
    return { success: false, error, fallbackUsed: true, data: error.fallbackData };
  }
}

/**
 * カレンダー生成のエラーハンドリング
 */
export function handleCalendarGenerationError(
  year: number,
  month: number,
  error: unknown
): ErrorHandlerResult<CalendarDay[]> {
  const now = new Date();
  const fallbackYear = now.getFullYear();
  const fallbackMonth = now.getMonth() + 1;

  // 基本的なフォールバックカレンダーデータを生成
  const fallbackData: CalendarDay[] = [];
  const daysInMonth = new Date(fallbackYear, fallbackMonth - 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(fallbackYear, fallbackMonth - 1, day);
    fallbackData.push({
      date,
      hasPost: false,
      postCount: 0,
      isToday: day === now.getDate() && fallbackMonth === now.getMonth() + 1 && fallbackYear === now.getFullYear(),
      isSelected: false
    });
  }

  const diaryError = createDiaryError(
    {
      type: 'CALENDAR_GENERATION_ERROR',
      message: ERROR_MESSAGES.CALENDAR.GENERATION_FAILED,
      context: { year, month, originalError: error }
    },
    ErrorLevel.ERROR,
    true,
    fallbackData
  );

  return {
    success: false,
    error: diaryError,
    fallbackUsed: true,
    data: fallbackData
  };
}

/**
 * 統計計算のエラーハンドリング
 */
export function handleStatsCalculationError(
  operation: string,
  error: unknown,
  partialStats?: Partial<DiaryStats>
): ErrorHandlerResult<DiaryStats> {
  // 部分的な統計データまたはデフォルト値を使用
  const fallbackStats: DiaryStats = {
    totalPosts: partialStats?.totalPosts ?? 0,
    totalDays: partialStats?.totalDays ?? 0,
    currentStreak: partialStats?.currentStreak ?? 0,
    longestStreak: partialStats?.longestStreak ?? 0,
    thisMonthPosts: partialStats?.thisMonthPosts ?? 0,
    averagePostsPerDay: partialStats?.averagePostsPerDay ?? 0
  };

  const diaryError = createDiaryError(
    {
      type: 'STATS_CALCULATION_ERROR',
      message: `${operation}: ${ERROR_MESSAGES.STATS.CALCULATION_FAILED}`,
      context: { operation, originalError: error, partialStats }
    },
    ErrorLevel.WARNING, // 部分表示可能なので警告レベル
    true,
    fallbackStats
  );

  return {
    success: false,
    error: diaryError,
    fallbackUsed: true,
    data: fallbackStats
  };
}

/**
 * 日記エントリー作成のエラーハンドリング
 */
export function handleDiaryEntryError(
  error: unknown,
  fallbackEntries: DiaryEntry[] = []
): ErrorHandlerResult<DiaryEntry[]> {
  const diaryError = createDiaryError(
    {
      type: 'DIARY_ENTRY_ERROR',
      message: ERROR_MESSAGES.DIARY.ENTRY_CREATION_FAILED,
      context: { originalError: error }
    },
    ErrorLevel.ERROR,
    true,
    fallbackEntries
  );

  return {
    success: false,
    error: diaryError,
    fallbackUsed: true,
    data: fallbackEntries
  };
}

/**
 * エラーレベルに基づいてコンソールにログ出力
 */
export function logDiaryError(errorInfo: DiaryErrorInfo): void {
  const logMessage = `[${errorInfo.level.toUpperCase()}] ${errorInfo.type}: ${errorInfo.message}`;
  
  switch (errorInfo.level) {
    case ErrorLevel.INFO:
      console.info(logMessage, errorInfo.context);
      break;
    case ErrorLevel.WARNING:
      console.warn(logMessage, errorInfo.context);
      break;
    case ErrorLevel.ERROR:
      console.error(logMessage, errorInfo.context);
      break;
    case ErrorLevel.CRITICAL:
      console.error(`🚨 CRITICAL: ${logMessage}`, errorInfo.context);
      break;
  }
}

/**
 * エラー情報をユーザー向けメッセージに変換
 */
export function getErrorDisplayMessage(errorInfo: DiaryErrorInfo): string {
  switch (errorInfo.type) {
    case 'DATE_RANGE_ERROR':
      return errorInfo.recoverable 
        ? `${errorInfo.message} 自動的に修正されました。`
        : errorInfo.message;
    
    case 'CALENDAR_GENERATION_ERROR':
      return errorInfo.recoverable
        ? 'カレンダーの表示で問題が発生しましたが、今月のデータを表示しています。'
        : 'カレンダーの表示に失敗しました。';
    
    case 'STATS_CALCULATION_ERROR':
      return errorInfo.recoverable
        ? '一部の統計情報の計算に失敗しましたが、利用可能なデータを表示しています。'
        : '統計情報の計算に失敗しました。';
    
    case 'DIARY_ENTRY_ERROR':
      return errorInfo.recoverable
        ? '日記データの読み込みで問題が発生しましたが、利用可能なデータを表示しています。'
        : '日記データの読み込みに失敗しました。';
    
    case 'DATE_VALIDATION_ERROR':
      return errorInfo.recoverable
        ? `${errorInfo.message} 今日の日付を使用します。`
        : errorInfo.message;
    
    default:
      return errorInfo.recoverable
        ? '問題が発生しましたが、代替データを表示しています。'
        : '予期しないエラーが発生しました。';
  }
}