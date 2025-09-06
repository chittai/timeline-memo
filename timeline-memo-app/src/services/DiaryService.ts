import type { Post, DiaryEntry, DiaryStats, DiaryService as IDiaryService } from '../types';
import type { DataService } from './DataService';

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
    const grouped = new Map<string, Post[]>();
    
    // 投稿を日付ごとにグループ化
    posts.forEach(post => {
      const dateKey = this.formatDateKey(post.createdAt);
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(post);
    });
    
    // DiaryEntry形式に変換し、日付の新しい順にソート
    return Array.from(grouped.entries())
      .map(([date, posts]) => ({
        date,
        posts: posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        postCount: posts.length
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
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
    try {
      // 日付範囲のバリデーション
      if (start > end) {
        throw new Error('開始日は終了日より前である必要があります');
      }

      // 指定範囲の投稿を取得
      const posts = await this.dataService.getPostsByDateRange(start, end);
      
      // 日付ごとにグループ化して返す
      return this.groupPostsByDate(posts);
    } catch (error) {
      console.error('日付範囲での日記エントリー取得に失敗しました:', error);
      throw new Error(`日付範囲での日記エントリー取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  /**
   * 指定した日付の日記エントリーを取得
   * @param date 取得する日付
   * @returns 指定日の日記エントリー（存在しない場合はnull）
   */
  async getEntryByDate(date: Date): Promise<DiaryEntry | null> {
    try {
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
      console.error('指定日の日記エントリー取得に失敗しました:', error);
      throw new Error(`指定日の日記エントリー取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
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

      // 日付ごとにグループ化
      const entries = this.groupPostsByDate(posts);
      
      // 今月の投稿数を計算
      const today = new Date();
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      
      const thisMonthPosts = posts.filter(post => 
        post.createdAt >= thisMonth && post.createdAt < nextMonth
      ).length;

      // 継続日数を計算
      const { current, longest } = this.calculateStreak(posts);

      // 1日あたりの平均投稿数を計算
      const averagePostsPerDay = entries.length > 0 ? posts.length / entries.length : 0;

      return {
        totalPosts: posts.length,
        totalDays: entries.length,
        currentStreak: current,
        longestStreak: longest,
        thisMonthPosts,
        averagePostsPerDay: Math.round(averagePostsPerDay * 100) / 100 // 小数点以下2桁で四捨五入
      };
    } catch (error) {
      console.error('統計情報の取得に失敗しました:', error);
      throw new Error(`統計情報の取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  /**
   * 継続日数を計算
   * @param posts 投稿の配列
   * @returns 現在の継続日数と最長継続日数
   */
  calculateStreak(posts: Post[]): { current: number; longest: number } {
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
      }
    }

    // 最長継続日数を計算
    for (let i = 1; i < sortedDates.length; i++) {
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
    }
    
    // 最後のストリークも考慮
    longestStreak = Math.max(longestStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak };
  }
}