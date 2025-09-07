/**
 * 日記機能固有のエラー型定義
 */

// 基本エラー型
export interface BaseError {
  type: string;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}

// 日記機能固有のエラー型
export type DiaryError = 
  | { type: 'DATE_RANGE_ERROR'; message: string; context?: { start?: Date; end?: Date; originalError?: any } }
  | { type: 'CALENDAR_GENERATION_ERROR'; message: string; context?: { year?: number; month?: number; postId?: string; postsCount?: number; createdAt?: Date; date?: Date | string; error?: any; originalError?: any } }
  | { type: 'STATS_CALCULATION_ERROR'; message: string; context?: { operation?: string; data?: any; index?: number; error?: any; prevDate?: Date | string; currentDate?: string; datesCount?: number; originalError?: any; postId?: string; createdAt?: Date; postsCount?: number; partialStats?: any } }
  | { type: 'DIARY_ENTRY_ERROR'; message: string; context?: { date?: string; postCount?: number; postId?: string; postsCount?: number; createdAt?: Date; error?: any; originalError?: any } }
  | { type: 'DATE_VALIDATION_ERROR'; message: string; context?: { invalidDate?: any; date?: Date | string; start?: Date; end?: Date; originalError?: any } };

// エラーレベル
export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// エラー情報の詳細
export interface DiaryErrorInfo extends BaseError {
  level: ErrorLevel;
  recoverable: boolean;
  fallbackData?: any;
}

// エラーハンドラーの結果
export interface ErrorHandlerResult<T = any> {
  success: boolean;
  data?: T;
  error?: DiaryErrorInfo;
  fallbackUsed: boolean;
}

// エラーメッセージの定数
export const ERROR_MESSAGES = {
  DATE_RANGE: {
    INVALID_RANGE: '無効な日付範囲が指定されました',
    START_AFTER_END: '開始日が終了日より後になっています',
    FUTURE_DATE: '未来の日付は指定できません',
    TOO_WIDE_RANGE: '日付範囲が広すぎます（最大1年間）'
  },
  CALENDAR: {
    INVALID_MONTH: '無効な月が指定されました',
    INVALID_YEAR: '無効な年が指定されました',
    GENERATION_FAILED: 'カレンダーデータの生成に失敗しました'
  },
  STATS: {
    CALCULATION_FAILED: '統計の計算に失敗しました',
    INSUFFICIENT_DATA: '統計計算に必要なデータが不足しています',
    STREAK_CALCULATION_ERROR: '継続日数の計算でエラーが発生しました'
  },
  DIARY: {
    ENTRY_CREATION_FAILED: '日記エントリーの作成に失敗しました',
    GROUPING_FAILED: '投稿のグループ化に失敗しました'
  },
  VALIDATION: {
    INVALID_DATE_FORMAT: '日付の形式が正しくありません',
    DATE_OUT_OF_RANGE: '日付が有効な範囲外です'
  }
} as const;