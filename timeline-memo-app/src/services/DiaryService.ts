import type { Post, DiaryEntry, DiaryStats, DiaryService as IDiaryService } from '../types';
import type { DataService } from './DataService';
import { 
  validateDateRange, 
  handleDiaryEntryError, 
  handleStatsCalculationError,
  logDiaryError,
  ErrorLevel,
  createDiaryError,
  ERROR_MESSAGES
} from '../utils/diaryErrorUtils';
// import type { ErrorHandlerResult } from '../types/errors';

/**
 * 日記機能を提供するサービスクラス
 * 投稿を日付ベースで管理し、日記形式での表示をサポートします
 */
export class DiaryService implements IDiaryService {
  private dataService: DataService;

  constructor(dataService: DataService) {
    this.dataService = dataService;
  }

  /**
   * 投稿を日付でグループ化する
   * @param posts 投稿の配列
   * @returns 日付ごとにグループ化された日記エントリー
   */
  private groupPostsByDate(posts: Post[]): DiaryEntry[] {
    try {
      const grouped = new Map<string, Post[]>();
      
      // 投稿を日付ごとにグループ化
      posts.forEach(post => {
        try {
          const dateKey = this.formatDateKey(post.createdAt);
          if (!grouped.has(dateKey)) {
            grouped.set(dateKey, []);
          }
          grouped.get(dateKey)!.push(post);
        } catch (error) {
          // 個別の投稿でエラーが発生した場合はログに記録してスキップ
          const errorInfo = createDiaryError(
            {
              type: 'DIARY_ENTRY_ERROR',
              message: '投稿の日付処理でエラーが発生しました',
              context: { postId: post.id, createdAt: post.createdAt, error }
            },
            ErrorLevel.WARNING,
            true
          );
          logDiaryError(errorInfo);
        }
      });
      
      // DiaryEntry形式に変換し、日付の新しい順にソート
      return Array.from(grouped.entries())
        .map(([date, posts]) => ({
          date,
          posts: posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
          postCount: posts.length
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      // グループ化全体でエラーが発生した場合
      const errorInfo = createDiaryError(
        {
          type: 'DIARY_ENTRY_ERROR',
          message: ERROR_MESSAGES.DIARY.GROUPING_FAILED,
          context: { postsCount: posts.length, error }
        },
        ErrorLevel.ERROR,
        true,
        []
      );
      logDiaryError(errorInfo);
      return [];
    }
  }

  /**
   * 日付をYYYY-MM-DD形式の文字列に変換
   * @param date 変換する日付
   * @returns YYYY-MM-DD形式の文字列
   */
  private formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 2つの日付が同じ日かどうかを判定
   * @param date1 比較する日付1
   * @param date2 比較する日付2
   * @returns 同じ日の場合true
   */


  /**
   * 指定した日付範囲の日記エントリーを取得
   * @param start 開始日
   * @param end 終了日
   * @returns 日付範囲内の日記エントリー
   */
  async getEntriesByDateRange(start: Date, end: Date): Promise<DiaryEntry[]> {
    // 日付範囲のバリデーション
    const validationResult = validateDateRange(start, end);
    
    if (!validationResult.success && validationResult.error) {
      logDiaryError(validationResult.error);
      
      // 回復可能なエラーの場合は修正された日付を使用
      if (validationResult.error.recoverable && validationResult.fallbackUsed && validationResult.data) {
        start = validationResult.data.start;
        end = validationResult.data.end;
      } else {
        // 回復不可能なエラーの場合は空の配列を返す
        return [];
      }
    }

    try {
      // 指定範囲の投稿を取得
      const posts = await this.dataService.getPostsByDateRange(start, end);
      
      // 日付ごとにグループ化して返す
      return this.groupPostsByDate(posts);
    } catch (error) {
      // データ取得エラーの場合
      const errorResult = handleDiaryEntryError(error);
      if (errorResult.error) {
        logDiaryError(errorResult.error);
      }
      return errorResult.data || [];
    }
  }

  /**
   * 指定した日付の日記エントリーを取得
   * @param date 取得する日付
   * @returns 指定日の日記エントリー（存在しない場合はnull）
   */
  async getEntryByDate(date: Date): Promise<DiaryEntry | null> {
    try {
      // 日付の有効性チェック
      if (isNaN(date.getTime())) {
        const errorInfo = createDiaryError(
          {
            type: 'DATE_VALIDATION_ERROR',
            message: ERROR_MESSAGES.VALIDATION.INVALID_DATE_FORMAT,
            context: { invalidDate: date }
          },
          ErrorLevel.ERROR,
          false
        );
        logDiaryError(errorInfo);
        return null;
      }

      // 指定日の開始時刻と終了時刻を設定
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // 指定日の投稿を取得
      const posts = await this.dataService.getPostsByDateRange(startOfDay, endOfDay);
      
      if (posts.length === 0) {
        return null;
      }

      // 日記エントリー形式で返す
      return {
        date: this.formatDateKey(date),
        posts: posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        postCount: posts.length
      };
    } catch (error) {
      const errorResult = handleDiaryEntryError(error);
      if (errorResult.error) {
        logDiaryError(errorResult.error);
      }
      return null;
    }
  }

  /**
   * 指定した年月のカレンダーデータを取得
   * @param year 年
   * @param month 月（1-12）
   * @returns カレンダーデータ
   * @deprecated CalendarServiceを使用してください
   */
  async getCalendarData(year: number, month: number): Promise<import('../types').CalendarDay[]> {
    // 後方互換性のため、CalendarServiceに委譲
    const { CalendarService } = await import('./CalendarService');
    const calendarService = new CalendarService(this.dataService);
    return calendarService.generateMonthlyCalendarData(year, month);
  }

  /**
   * 日記の統計情報を取得
   * @returns 統計情報
   */
  async getStats(): Promise<DiaryStats> {
    const partialStats: Partial<DiaryStats> = {};
    
    try {
      // 全ての投稿を取得
      const posts = await this.dataService.getAllPosts();
      
      if (posts.length === 0) {
        return {
          totalPosts: 0,
          totalDays: 0,
          currentStreak: 0,
          longestStreak: 0,
          thisMonthPosts: 0,
          averagePostsPerDay: 0
        };
      }

      // 基本統計（投稿数）は確実に計算できる
      partialStats.totalPosts = posts.length;

      try {
        // 日付ごとにグループ化
        const entries = this.groupPostsByDate(posts);
        partialStats.totalDays = entries.length;
      } catch (error) {
        const errorResult = handleStatsCalculationError('日付グループ化', error, partialStats);
        if (errorResult.error) {
          logDiaryError(errorResult.error);
        }
      }

      try {
        // 今月の投稿数を計算
        const today = new Date();
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        
        partialStats.thisMonthPosts = posts.filter(post => 
          post.createdAt >= thisMonth && post.createdAt < nextMonth
        ).length;
      } catch (error) {
        const errorResult = handleStatsCalculationError('今月の投稿数計算', error, partialStats);
        if (errorResult.error) {
          logDiaryError(errorResult.error);
        }
      }

      try {
        // 継続日数を計算
        const { current, longest } = this.calculateStreak(posts);
        partialStats.currentStreak = current;
        partialStats.longestStreak = longest;
      } catch (error) {
        const errorResult = handleStatsCalculationError('継続日数計算', error, partialStats);
        if (errorResult.error) {
          logDiaryError(errorResult.error);
        }
      }

      try {
        // 1日あたりの平均投稿数を計算
        const totalDays = partialStats.totalDays || 0;
        const averagePostsPerDay = totalDays > 0 ? posts.length / totalDays : 0;
        partialStats.averagePostsPerDay = Math.round(averagePostsPerDay * 100) / 100;
      } catch (error) {
        const errorResult = handleStatsCalculationError('平均投稿数計算', error, partialStats);
        if (errorResult.error) {
          logDiaryError(errorResult.error);
        }
      }

      // 部分的な統計でも返す
      return {
        totalPosts: partialStats.totalPosts || 0,
        totalDays: partialStats.totalDays || 0,
        currentStreak: partialStats.currentStreak || 0,
        longestStreak: partialStats.longestStreak || 0,
        thisMonthPosts: partialStats.thisMonthPosts || 0,
        averagePostsPerDay: partialStats.averagePostsPerDay || 0
      };
    } catch (error) {
      // 全体的なエラーの場合
      const errorResult = handleStatsCalculationError('統計情報取得', error, partialStats);
      if (errorResult.error) {
        logDiaryError(errorResult.error);
      }
      return errorResult.data || {
        totalPosts: 0,
        totalDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        thisMonthPosts: 0,
        averagePostsPerDay: 0
      };
    }
  }

  /**
   * 継続日数を計算
   * @param posts 投稿の配列
   * @returns 現在の継続日数と最長継続日数
   */
  calculateStreak(posts: Post[]): { current: number; longest: number } {
    try {
      if (posts.length === 0) {
        return { current: 0, longest: 0 };
      }

      // 投稿を日付でグループ化し、日付順にソート
      const entries = this.groupPostsByDate(posts);
      const sortedDates = entries.map(entry => entry.date).sort();

      if (sortedDates.length === 0) {
        return { current: 0, longest: 0 };
      }

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 1;

      try {
        // 今日の日付
        const today = new Date();
        const todayKey = this.formatDateKey(today);
        
        // 昨日の日付
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = this.formatDateKey(yesterday);

        // 最新の投稿日から現在の継続日数を計算
        const latestDate = sortedDates[sortedDates.length - 1];
        
        // 今日または昨日に投稿がある場合のみ現在の継続日数を計算
        if (latestDate === todayKey || latestDate === yesterdayKey) {
          currentStreak = 1;
          
          // 最新日から遡って継続日数を計算
          for (let i = sortedDates.length - 2; i >= 0; i--) {
            try {
              const currentDate = new Date(sortedDates[i + 1]);
              const prevDate = new Date(sortedDates[i]);
              
              // 前日かどうかをチェック
              const expectedPrevDate = new Date(currentDate);
              expectedPrevDate.setDate(expectedPrevDate.getDate() - 1);
              
              if (this.formatDateKey(prevDate) === this.formatDateKey(expectedPrevDate)) {
                currentStreak++;
              } else {
                break;
              }
            } catch (error) {
              // 個別の日付処理でエラーが発生した場合はログに記録してループを終了
              const errorInfo = createDiaryError(
                {
                  type: 'STATS_CALCULATION_ERROR',
                  message: '現在の継続日数計算中にエラーが発生しました',
                  context: { index: i, error }
                },
                ErrorLevel.WARNING,
                true
              );
              logDiaryError(errorInfo);
              break;
            }
          }
        }
      } catch (error) {
        // 現在の継続日数計算でエラーが発生した場合
        const errorInfo = createDiaryError(
          {
            type: 'STATS_CALCULATION_ERROR',
            message: ERROR_MESSAGES.STATS.STREAK_CALCULATION_ERROR,
            context: { operation: 'current streak', error }
          },
          ErrorLevel.WARNING,
          true
        );
        logDiaryError(errorInfo);
        currentStreak = 0;
      }

      try {
        // 最長継続日数を計算
        for (let i = 1; i < sortedDates.length; i++) {
          try {
            const currentDate = new Date(sortedDates[i]);
            const prevDate = new Date(sortedDates[i - 1]);
            
            // 連続する日付かどうかをチェック
            const expectedNextDate = new Date(prevDate);
            expectedNextDate.setDate(expectedNextDate.getDate() + 1);
            
            if (this.formatDateKey(currentDate) === this.formatDateKey(expectedNextDate)) {
              tempStreak++;
            } else {
              longestStreak = Math.max(longestStreak, tempStreak);
              tempStreak = 1;
            }
          } catch (error) {
            // 個別の日付処理でエラーが発生した場合はログに記録して継続
            const errorInfo = createDiaryError(
              {
                type: 'STATS_CALCULATION_ERROR',
                message: '最長継続日数計算中にエラーが発生しました',
                context: { index: i, error }
              },
              ErrorLevel.WARNING,
              true
            );
            logDiaryError(errorInfo);
            // エラーが発生した場合は現在のストリークをリセット
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        
        // 最後のストリークも考慮
        longestStreak = Math.max(longestStreak, tempStreak);
      } catch (error) {
        // 最長継続日数計算でエラーが発生した場合
        const errorInfo = createDiaryError(
          {
            type: 'STATS_CALCULATION_ERROR',
            message: ERROR_MESSAGES.STATS.STREAK_CALCULATION_ERROR,
            context: { operation: 'longest streak', error }
          },
          ErrorLevel.WARNING,
          true
        );
        logDiaryError(errorInfo);
        longestStreak = 0;
      }

      return { current: currentStreak, longest: longestStreak };
    } catch (error) {
      // 継続日数計算全体でエラーが発生した場合
      const errorInfo = createDiaryError(
        {
          type: 'STATS_CALCULATION_ERROR',
          message: ERROR_MESSAGES.STATS.STREAK_CALCULATION_ERROR,
          context: { postsCount: posts.length, error }
        },
        ErrorLevel.ERROR,
        true,
        { current: 0, longest: 0 }
      );
      logDiaryError(errorInfo);
      return { current: 0, longest: 0 };
    }
  }
}